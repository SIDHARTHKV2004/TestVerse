package com.testverse.service;

import com.testverse.model.*;
import com.testverse.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final AttendanceRepository attendanceRepository;
    private final NotificationRepository notificationRepository;
    private final MessageRepository messageRepository;
    private final TeamRepository teamRepository;
    private final InvitationRepository invitationRepository;
    private final ProjectRepository projectRepository;
    private final AutomationScriptRepository automationScriptRepository;
    private final CommunityPostRepository communityPostRepository;
    private final CommunityCommentRepository communityCommentRepository;
    private final TaskRepository taskRepository;
    private final BugReportRepository bugReportRepository;

    /**
     * Safely deletes a user while preserving shared entity history,
     * unassigning references, and removing personal dependent records in a single transaction.
     *
     * @param targetUser The user entity to delete
     */
    @Transactional
    public void deleteUser(UserEntity targetUser) {
        Long userId = targetUser.getId();
        log.info("Starting safe deletion for user ID: {}, email: {}", userId, targetUser.getEmail());

        // 1. Unassign mentees who have this user as their mentor (preserves mentee accounts)
        List<UserEntity> mentees = userRepository.findByMentor(targetUser);
        for (UserEntity mentee : mentees) {
            mentee.setMentor(null);
            userRepository.save(mentee);
        }

        // 2. Clear target user's own mentor and team references
        targetUser.setMentor(null);
        targetUser.setTeam(null);
        userRepository.save(targetUser);

        // 3. Unlink user from any teams where they are the team admin (preserves the team)
        List<TeamEntity> teamsWhereAdmin = teamRepository.findByAdminId(userId);
        for (TeamEntity team : teamsWhereAdmin) {
            team.setAdmin(null);
            teamRepository.save(team);
        }

        // 4. Clear invitedBy reference on invitations (preserves invitations)
        List<InvitationEntity> invitations = invitationRepository.findByInvitedBy(targetUser);
        for (InvitationEntity invitation : invitations) {
            invitation.setInvitedBy(null);
            invitationRepository.save(invitation);
        }

        // 5. Preserve shared projects by clearing createdBy reference
        List<ProjectEntity> createdProjects = projectRepository.findByCreatedById(userId);
        for (ProjectEntity project : createdProjects) {
            project.setCreatedBy(null);
            projectRepository.save(project);
        }

        // 6. Preserve automation scripts by clearing createdBy reference
        List<AutomationScriptEntity> scripts = automationScriptRepository.findByCreatedById(userId);
        for (AutomationScriptEntity script : scripts) {
            script.setCreatedBy(null);
            automationScriptRepository.save(script);
        }

        // 7. Delete personal attendance records belonging to this user
        List<AttendanceEntity> attendances = attendanceRepository.findByUser(targetUser);
        if (!attendances.isEmpty()) {
            attendanceRepository.deleteAll(attendances);
        }

        // 8. Delete personal notifications addressed to this user
        List<NotificationEntity> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        if (!notifications.isEmpty()) {
            notificationRepository.deleteAll(notifications);
        }

        // 9. Delete messages sent or received by this user to satisfy foreign key constraints
        List<MessageEntity> sentMessages = messageRepository.findBySenderIdOrderByCreatedAtDesc(userId);
        List<MessageEntity> receivedMessages = messageRepository.findByReceiverId(userId);
        Set<MessageEntity> messagesToDelete = new HashSet<>(sentMessages);
        messagesToDelete.addAll(receivedMessages);
        if (!messagesToDelete.isEmpty()) {
            messageRepository.deleteAll(messagesToDelete);
        }

        // 10. Handle community comments and posts.
        //     NOTE: CommunityPostEntity.author_id and CommunityCommentEntity.author_id are both
        //     declared NOT NULL in the schema, so they cannot be set to null.
        //     Consequence:
        //       (a) Comments authored by the deleted user on any post are deleted first.
        //       (b) Posts authored by the deleted user are then deleted — and all remaining
        //           comments on those posts (from other users) must also be deleted to satisfy
        //           the community_comments.post_id NOT NULL FK constraint.
        //     This is the only safe path without a DDL schema change (e.g. ON DELETE SET NULL).
        List<CommunityCommentEntity> userComments = communityCommentRepository.findByAuthorId(userId);
        if (!userComments.isEmpty()) {
            communityCommentRepository.deleteAll(userComments);
        }

        List<CommunityPostEntity> userPosts = communityPostRepository.findByAuthorId(userId);
        for (CommunityPostEntity post : userPosts) {
            List<CommunityCommentEntity> postComments = communityCommentRepository.findByPostId(post.getId());
            if (!postComments.isEmpty()) {
                communityCommentRepository.deleteAll(postComments);
            }
            communityPostRepository.delete(post);
        }

        // 11. Unassign tasks assigned to or mentored by this user (preserves the tasks)
        List<TaskEntity> assignedTasks = taskRepository.findByAssignedStudentId(userId);
        for (TaskEntity task : assignedTasks) {
            task.setAssignedStudentId(null);
            taskRepository.save(task);
        }

        List<TaskEntity> mentoredTasks = taskRepository.findByMentorId(userId);
        for (TaskEntity task : mentoredTasks) {
            task.setMentorId(null);
            taskRepository.save(task);
        }

        // 12. Unassign bug reports assigned to this user (preserves bug reports)
        List<BugReportEntity> assignedBugs = bugReportRepository.findByAssigneeId(userId);
        for (BugReportEntity bug : assignedBugs) {
            bug.setAssigneeId(null);
            bug.setAssigneeName("Unassigned");
            bugReportRepository.save(bug);
        }

        // 13. Delete the user entity
        userRepository.delete(targetUser);
        log.info("Successfully deleted user ID: {}", userId);
    }
}
