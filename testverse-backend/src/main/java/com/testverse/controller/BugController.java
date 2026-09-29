package com.testverse.controller;

import com.testverse.model.BugReportEntity;
import com.testverse.model.UserEntity;
import com.testverse.model.UserRole;
import com.testverse.model.UserStatus;
import com.testverse.repository.BugReportRepository;
import com.testverse.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/bugs")
@RequiredArgsConstructor
public class BugController {

    private final BugReportRepository bugReportRepository;
    private final UserRepository userRepository;

    // Get all bugs - Everyone can view
    @GetMapping
    public ResponseEntity<List<BugReportEntity>> getAllBugs() {
        return ResponseEntity.ok(bugReportRepository.findAll());
    }

    // Get bug by ID - Everyone can view
    @GetMapping("/{id}")
    public ResponseEntity<?> getBugById(@PathVariable String id) {
        return bugReportRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Create Bug - Only ADMIN and TESTER
    @PostMapping
    public ResponseEntity<?> createBug(@RequestBody BugReportEntity bug) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserEntity)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Authentication required");
        }
        UserEntity currentUser = (UserEntity) auth.getPrincipal();

        if (currentUser.getRole() != UserRole.ADMIN &&
                currentUser.getRole() != UserRole.TESTER) {

            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only Admin and Tester can create bugs");
        }

        bug.setCreatedAt(LocalDateTime.now());
        bug.setUpdatedAt(LocalDateTime.now());

        if (bug.getStatus() == null) {
            bug.setStatus("OPEN");
        }

        if (bug.getSeverity() == null) {
            bug.setSeverity("MEDIUM");
        }

        if (bug.getPriority() == null) {
            bug.setPriority("MEDIUM");
        }

        // Set reporter ID if not set
        if (bug.getReporterId() == null) {
            bug.setReporterId(currentUser.getId());
            bug.setReporterName(currentUser.getName());
        }

        // Set reporter mentor ID if available
        if (bug.getReporterId() != null) {
            UserEntity reporter = userRepository.findById(bug.getReporterId()).orElse(null);
            if (reporter != null && reporter.getMentor() != null) {
                bug.setReporterMentorId(reporter.getMentor().getId());
            }
        }

        // Assign Developer if provided
        if (bug.getAssigneeId() != null) {
            UserEntity assignee = userRepository.findById(bug.getAssigneeId()).orElse(null);
            if (assignee != null && assignee.getRole() == UserRole.DEVELOPER && assignee.getStatus() == UserStatus.ACTIVE) {
                bug.setAssigneeId(assignee.getId());
                bug.setAssigneeName(assignee.getName());
                if (assignee.getMentor() != null) {
                    bug.setAssigneeMentorId(assignee.getMentor().getId());
                }
            } else {
                bug.setAssigneeId(null);
                bug.setAssigneeName(null);
                bug.setAssigneeMentorId(null);
            }
        }

        BugReportEntity savedBug = bugReportRepository.save(bug);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(savedBug);
    }

    // Update Bug Details - Only ADMIN, Bug Creator (Tester), or Mentor of the Bug Creator
    @PutMapping("/{id}")
    public ResponseEntity<?> updateBug(
            @PathVariable String id,
            @RequestBody BugReportEntity bugDetails) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserEntity)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Authentication required");
        }
        UserEntity currentUser = (UserEntity) auth.getPrincipal();

        return bugReportRepository.findById(id)
                .map(bug -> {

                    if (!canEditBug(bug, currentUser)) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body("You do not have permission to edit this bug. Only Admin, the bug creator, or their mentor can edit bug details.");
                    }

                    if (bugDetails.getTitle() != null) {
                        bug.setTitle(bugDetails.getTitle());
                    }
                    if (bugDetails.getDescription() != null) {
                        bug.setDescription(bugDetails.getDescription());
                    }
                    if (bugDetails.getSeverity() != null) {
                        bug.setSeverity(bugDetails.getSeverity());
                    }
                    if (bugDetails.getPriority() != null) {
                        bug.setPriority(bugDetails.getPriority());
                    }
                    if (bugDetails.getStepsToReproduce() != null) {
                        bug.setStepsToReproduce(bugDetails.getStepsToReproduce());
                    }
                    if (bugDetails.getExpectedResult() != null) {
                        bug.setExpectedResult(bugDetails.getExpectedResult());
                    }
                    if (bugDetails.getActualResult() != null) {
                        bug.setActualResult(bugDetails.getActualResult());
                    }

                    // Handle Developer assignment updates
                    if (bugDetails.getAssigneeId() != null) {
                        UserEntity assignee = userRepository.findById(bugDetails.getAssigneeId()).orElse(null);
                        if (assignee != null && assignee.getRole() == UserRole.DEVELOPER && assignee.getStatus() == UserStatus.ACTIVE) {
                            bug.setAssigneeId(assignee.getId());
                            bug.setAssigneeName(assignee.getName());
                            if (assignee.getMentor() != null) {
                                bug.setAssigneeMentorId(assignee.getMentor().getId());
                            }
                        }
                    } else if (bugDetails.getAssigneeName() == null || bugDetails.getAssigneeName().isEmpty()) {
                        bug.setAssigneeId(null);
                        bug.setAssigneeName(null);
                        bug.setAssigneeMentorId(null);
                    }

                    // Preserve existing bug status-change permission rules if status is provided in update
                    if (bugDetails.getStatus() != null && !bugDetails.getStatus().equalsIgnoreCase(bug.getStatus())) {
                        if (canChangeBugStatus(bug, currentUser)) {
                            bug.setStatus(bugDetails.getStatus());
                        }
                    }

                    bug.setUpdatedAt(LocalDateTime.now());

                    return ResponseEntity.ok(
                            bugReportRepository.save(bug)
                    );
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Helper: Determine if user can edit/update bug details
    // 1. ADMIN -> can edit any bug
    // 2. The Tester who created/reported the bug -> can edit only their own created bugs
    // 3. The Mentor of the Tester who created/reported the bug -> can edit that tester's bugs
    // Note: Assigned Developer must NOT receive edit permission.
    private boolean canEditBug(BugReportEntity bug, UserEntity currentUser) {
        if (bug == null || currentUser == null) {
            return false;
        }

        // 1. ADMIN -> can edit any bug
        if (currentUser.getRole() == UserRole.ADMIN) {
            return true;
        }

        Long currentUserId = currentUser.getId();
        if (currentUserId == null) {
            return false;
        }

        // 2. The Tester who created/reported the bug
        if (bug.getReporterId() != null && currentUserId.equals(bug.getReporterId())) {
            return true;
        }

        // 3. The Mentor of the Tester who created/reported the bug
        if (bug.getReporterMentorId() != null && currentUserId.equals(bug.getReporterMentorId())) {
            return true;
        }

        // Dynamic lookup for reporter's mentor
        if (bug.getReporterId() != null) {
            UserEntity reporter = userRepository.findById(bug.getReporterId()).orElse(null);
            if (reporter != null && reporter.getMentor() != null && currentUserId.equals(reporter.getMentor().getId())) {
                return true;
            }
        }

        return false;
    }

    // Update Bug Status - Only Creator, Assigned Developer, or Appropriate Mentor
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateBugStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> statusUpdate) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserEntity)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Authentication required");
        }
        UserEntity currentUser = (UserEntity) auth.getPrincipal();

        return bugReportRepository.findById(id)
                .map(bug -> {

                    if (!canChangeBugStatus(bug, currentUser)) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body("You do not have permission to change the status of this bug. Only the bug creator, assigned developer, or their mentor can change bug status.");
                    }

                    String newStatus = statusUpdate.get("status");

                    if (newStatus == null || newStatus.isEmpty()) {
                        return ResponseEntity.badRequest()
                                .body("Status is required");
                    }

                    bug.setStatus(newStatus);
                    bug.setUpdatedAt(LocalDateTime.now());

                    return ResponseEntity.ok(
                            bugReportRepository.save(bug)
                    );
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Helper: Determine if user can change bug status
    private boolean canChangeBugStatus(BugReportEntity bug, UserEntity currentUser) {
        if (bug == null || currentUser == null) {
            return false;
        }

        Long currentUserId = currentUser.getId();
        if (currentUserId == null) {
            return false;
        }

        // Person 1: Bug creator/reporter
        if (bug.getReporterId() != null && currentUserId.equals(bug.getReporterId())) {
            return true;
        }

        // Person 2: Assigned developer
        if (bug.getAssigneeId() != null && currentUserId.equals(bug.getAssigneeId())) {
            return true;
        }

        // Person 3: The appropriate mentor associated with the bug workflow
        // Check cached mentor IDs
        if (bug.getReporterMentorId() != null && currentUserId.equals(bug.getReporterMentorId())) {
            return true;
        }
        if (bug.getAssigneeMentorId() != null && currentUserId.equals(bug.getAssigneeMentorId())) {
            return true;
        }

        // Dynamic lookup for reporter's mentor (in case cached ID was null)
        if (bug.getReporterId() != null) {
            UserEntity reporter = userRepository.findById(bug.getReporterId()).orElse(null);
            if (reporter != null && reporter.getMentor() != null && currentUserId.equals(reporter.getMentor().getId())) {
                return true;
            }
        }

        // Dynamic lookup for assigned developer's mentor
        if (bug.getAssigneeId() != null) {
            UserEntity assignee = userRepository.findById(bug.getAssigneeId()).orElse(null);
            if (assignee != null && assignee.getMentor() != null && currentUserId.equals(assignee.getMentor().getId())) {
                return true;
            }
        }

        return false;
    }

    // Delete Bug - Only ADMIN and TESTER
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBug(@PathVariable String id) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserEntity)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Authentication required");
        }
        UserEntity currentUser = (UserEntity) auth.getPrincipal();

        if (currentUser.getRole() != UserRole.ADMIN &&
                currentUser.getRole() != UserRole.TESTER) {

            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only Admin and Tester can delete bugs");
        }

        return bugReportRepository.findById(id)
                .map(bug -> {

                    // Testers can only delete bugs they created
                    if (currentUser.getRole() == UserRole.TESTER) {

                        if (!Objects.equals(
                                bug.getReporterId(),
                                currentUser.getId())) {

                            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                    .body("Testers can only delete bugs they created");
                        }
                    }

                    bugReportRepository.deleteById(id);

                    return ResponseEntity.ok(
                            "Bug deleted successfully"
                    );
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Get bugs by status - Everyone can view
    @GetMapping("/status/{status}")
    public ResponseEntity<List<BugReportEntity>> getBugsByStatus(
            @PathVariable String status) {

        return ResponseEntity.ok(
                bugReportRepository.findByStatus(status)
        );
    }

    // Get bugs by reporter - Everyone can view
    // reporterId is a UserEntity ID, therefore Long
    @GetMapping("/reporter/{reporterId}")
    public ResponseEntity<List<BugReportEntity>> getBugsByReporter(
            @PathVariable Long reporterId) {

        return ResponseEntity.ok(
                bugReportRepository.findByReporterId(reporterId)
        );
    }

    // Get bugs by assignee - Everyone can view
    // assigneeId is a UserEntity ID, therefore Long
    @GetMapping("/assignee/{assigneeId}")
    public ResponseEntity<List<BugReportEntity>> getBugsByAssignee(
            @PathVariable Long assigneeId) {

        return ResponseEntity.ok(
                bugReportRepository.findByAssigneeId(assigneeId)
        );
    }
}