package com.testverse.controller;

import com.testverse.model.NotificationEntity;
import com.testverse.model.TaskEntity;
import com.testverse.model.UserEntity;
import com.testverse.model.UserRole;
import com.testverse.repository.NotificationRepository;
import com.testverse.repository.TaskRepository;
import com.testverse.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    // =========================================================
    // GET ALL TASKS
    // Everyone who is logged in can see tasks
    // =========================================================
    @GetMapping
    public ResponseEntity<List<TaskEntity>> getAllTasks() {
        return ResponseEntity.ok(taskRepository.findAll());
    }

    // =========================================================
    // GET TASK BY ID
    // =========================================================
    @GetMapping("/{id}")
    public ResponseEntity<?> getTaskById(@PathVariable String id) {

        Authentication auth =
                SecurityContextHolder.getContext().getAuthentication();

        if (auth == null ||
                !(auth.getPrincipal() instanceof UserEntity)) {

            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Authentication is required");
        }

        UserEntity currentUser =
                (UserEntity) auth.getPrincipal();

        return taskRepository.findById(id)
                .map(task -> {

                    // ADMIN can open any task
                    if (currentUser.getRole() == UserRole.ADMIN) {
                        return ResponseEntity.ok(task);
                    }

                    // MENTOR can open any task
                    if (currentUser.getRole() == UserRole.MENTOR) {
                        return ResponseEntity.ok(task);
                    }

                    // TESTER / DEVELOPER can open
                    // only the task assigned to them
                    if ((currentUser.getRole() == UserRole.TESTER ||
                            currentUser.getRole() == UserRole.DEVELOPER)
                            && currentUser.getId() != null
                            && currentUser.getId().equals(
                            task.getAssignedStudentId())) {

                        return ResponseEntity.ok(task);
                    }

                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body("You are not allowed to view this task");
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // =========================================================
    // GET USERS WHO CAN BE ASSIGNED TASKS
    //
    // Only:
    // ACTIVE TESTER
    // ACTIVE DEVELOPER
    //
    // These users will appear in the Assign To dropdown.
    // =========================================================
    @GetMapping("/assignable-users")
    public ResponseEntity<?> getAssignableUsers() {

        Authentication auth =
                SecurityContextHolder.getContext().getAuthentication();

        if (auth == null ||
                !(auth.getPrincipal() instanceof UserEntity)) {

            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Authentication is required");
        }

        List<UserEntity> users = userRepository.findAll();

        List<Map<String, Object>> assignableUsers = users.stream()
                .filter(user ->
                        user.getStatus() != null &&
                                user.getStatus().name().equals("ACTIVE")
                )
                .filter(user ->
                        user.getRole() == UserRole.TESTER ||
                                user.getRole() == UserRole.DEVELOPER
                )
                .map(user -> {

                    Map<String, Object> result = new HashMap<>();

                    result.put("id", user.getId());
                    result.put("name", user.getName());
                    result.put("username", user.getUsername());
                    result.put("email", user.getEmail());
                    result.put("role", user.getRole());

                    return result;
                })
                .toList();

        return ResponseEntity.ok(assignableUsers);
    }

    // =========================================================
    // CREATE TASK
    //
    // ADMIN + MENTOR
    // =========================================================
    @PostMapping
    public ResponseEntity<?> createTask(@RequestBody TaskEntity task) {

        Authentication auth =
                SecurityContextHolder.getContext().getAuthentication();

        UserEntity currentUser = (UserEntity) auth.getPrincipal();

        if (currentUser.getRole() != UserRole.ADMIN &&
                currentUser.getRole() != UserRole.MENTOR) {

            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only Admin and Mentor can create tasks");
        }

        task.setCreatedAt(LocalDateTime.now());
        task.setUpdatedAt(LocalDateTime.now());
        task.setCreatedById(currentUser.getId());
        task.setCreatedByName(currentUser.getName());

        // If Mentor creates the task,
        // store that Mentor as the task creator / mentor.
        if (currentUser.getRole() == UserRole.MENTOR) {
            task.setMentorId(currentUser.getId());
        }

        if (task.getStatus() == null) {
            task.setStatus("To Do");
        }

        if (task.getPriority() == null) {
            task.setPriority("Medium");
        }

        if (task.getAssignedStudentId() != null) {
            task.setIsNewAssignment(true);
        } else {
            task.setIsNewAssignment(false);
        }

        TaskEntity savedTask = taskRepository.save(task);

        if (savedTask.getAssignedStudentId() != null) {
            userRepository.findById(savedTask.getAssignedStudentId()).ifPresent(assignedUser -> {
                NotificationEntity notification = NotificationEntity.builder()
                        .title("New Task Assigned")
                        .message("New task assigned to you: " + savedTask.getTitle())
                        .user(assignedUser)
                        .type("TASK")
                        .senderId(currentUser.getId())
                        .taskId(savedTask.getId())
                        .isRead(false)
                        .isAccepted(false)
                        .isTaskViewed(false)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build();
                notificationRepository.save(notification);
            });
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(savedTask);
    }

    // =========================================================
    // UPDATE TASK STATUS
    //
    // Only:
    // 1. Task creator
    // 2. Assigned user
    // 3. Appropriate mentor
    // =========================================================
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateTaskStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> statusUpdate) {

        Authentication auth =
                SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !(auth.getPrincipal() instanceof UserEntity)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Authentication is required");
        }

        UserEntity currentUser = (UserEntity) auth.getPrincipal();

        return taskRepository.findById(id)
                .map(task -> {
                    if (!canChangeTaskStatus(task, currentUser)) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body("You do not have permission to change the status of this task. Only the task creator, assigned user, or their mentor can change task status.");
                    }

                    String newStatus = statusUpdate.get("status");
                    if (newStatus == null || newStatus.trim().isEmpty()) {
                        return ResponseEntity.badRequest().body("Status is required");
                    }

                    task.setStatus(newStatus.trim());
                    task.setIsNewAssignment(false);
                    task.setUpdatedAt(LocalDateTime.now());

                    return ResponseEntity.ok(taskRepository.save(task));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // =========================================================
    // UPDATE TASK DETAILS
    //
    // ADMIN + MENTOR + DEVELOPER + TESTER
    // Status changes are strictly restricted to creator, assigned user, and mentor.
    // =========================================================
    @PutMapping("/{id}")
    public ResponseEntity<?> updateTask(
            @PathVariable String id,
            @RequestBody TaskEntity taskDetails) {

        Authentication auth =
                SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !(auth.getPrincipal() instanceof UserEntity)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Authentication is required");
        }

        UserEntity currentUser = (UserEntity) auth.getPrincipal();

        if (currentUser.getRole() != UserRole.ADMIN &&
                currentUser.getRole() != UserRole.MENTOR &&
                currentUser.getRole() != UserRole.DEVELOPER &&
                currentUser.getRole() != UserRole.TESTER) {

            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("You do not have permission to update tasks");
        }

        return taskRepository.findById(id)
                .map(task -> {

                    boolean isStatusChanging = taskDetails.getStatus() != null &&
                            !taskDetails.getStatus().equals(task.getStatus());

                    if (isStatusChanging && !canChangeTaskStatus(task, currentUser)) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body("You do not have permission to change the status of this task. Only the task creator, assigned user, or their mentor can change task status.");
                    }

                    Long oldAssignedStudentId = task.getAssignedStudentId();
                    Long newAssignedStudentId = taskDetails.getAssignedStudentId();

                    task.setTitle(taskDetails.getTitle());
                    task.setDescription(taskDetails.getDescription());
                    if (taskDetails.getStatus() != null) {
                        task.setStatus(taskDetails.getStatus());
                    }
                    task.setPriority(taskDetails.getPriority());
                    task.setDueDate(taskDetails.getDueDate());
                    task.setAssignedStudentId(
                            taskDetails.getAssignedStudentId()
                    );
                    task.setModuleName(taskDetails.getModuleName());
                    task.setInstructions(taskDetails.getInstructions());
                    task.setSubmissionNotes(
                            taskDetails.getSubmissionNotes()
                    );

                    task.setUpdatedAt(LocalDateTime.now());

                    if (isStatusChanging) {
                        task.setIsNewAssignment(false);
                    }

                    if (newAssignedStudentId != null && !newAssignedStudentId.equals(oldAssignedStudentId)) {
                        task.setIsNewAssignment(true);
                    } else if (newAssignedStudentId == null) {
                        task.setIsNewAssignment(false);
                    }

                    TaskEntity saved = taskRepository.save(task);

                    // Notify when newly assigned or reassigned to a user
                    if (newAssignedStudentId != null && !newAssignedStudentId.equals(oldAssignedStudentId)) {
                        userRepository.findById(newAssignedStudentId).ifPresent(assignedUser -> {
                            NotificationEntity notification = NotificationEntity.builder()
                                    .title("New Task Assigned")
                                    .message("Task assigned to you: " + saved.getTitle())
                                    .user(assignedUser)
                                    .type("TASK")
                                    .senderId(currentUser.getId())
                                    .taskId(saved.getId())
                                    .isRead(false)
                                    .isAccepted(false)
                                    .isTaskViewed(false)
                                    .createdAt(LocalDateTime.now())
                                    .updatedAt(LocalDateTime.now())
                                    .build();
                            notificationRepository.save(notification);
                        });
                    } else if (newAssignedStudentId != null && !newAssignedStudentId.equals(currentUser.getId())) {
                        // Task updated by mentor/admin for the assigned user
                        userRepository.findById(newAssignedStudentId).ifPresent(assignedUser -> {
                            NotificationEntity notification = NotificationEntity.builder()
                                    .title("Task Updated")
                                    .message("Task updated: " + saved.getTitle())
                                    .user(assignedUser)
                                    .type("TASK")
                                    .senderId(currentUser.getId())
                                    .taskId(saved.getId())
                                    .isRead(false)
                                    .isAccepted(false)
                                    .isTaskViewed(false)
                                    .createdAt(LocalDateTime.now())
                                    .updatedAt(LocalDateTime.now())
                                    .build();
                            notificationRepository.save(notification);
                        });
                    }

                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // =========================================================
    // HELPER: CAN CHANGE TASK STATUS
    // =========================================================
    private boolean canChangeTaskStatus(TaskEntity task, UserEntity currentUser) {
        if (task == null || currentUser == null) {
            return false;
        }

        Long currentUserId = currentUser.getId();
        if (currentUserId == null) {
            return false;
        }

        // 1. The person who created the task
        if (task.getCreatedById() != null && currentUserId.equals(task.getCreatedById())) {
            return true;
        }

        // 2. The person assigned to the task
        if (task.getAssignedStudentId() != null && currentUserId.equals(task.getAssignedStudentId())) {
            return true;
        }

        // 3. The appropriate mentor
        // Direct task mentor
        if (task.getMentorId() != null && currentUserId.equals(task.getMentorId())) {
            return true;
        }

        // Mentor of the assigned user/student
        if (task.getAssignedStudentId() != null) {
            UserEntity assignedUser = userRepository.findById(task.getAssignedStudentId()).orElse(null);
            if (assignedUser != null && assignedUser.getMentor() != null && currentUserId.equals(assignedUser.getMentor().getId())) {
                return true;
            }
        }

        // Mentor of the task creator
        if (task.getCreatedById() != null) {
            UserEntity creator = userRepository.findById(task.getCreatedById()).orElse(null);
            if (creator != null && creator.getMentor() != null && currentUserId.equals(creator.getMentor().getId())) {
                return true;
            }
        }

        return false;
    }

    // =========================================================
    // DELETE TASK
    //
    // ADMIN ONLY
    // =========================================================
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTask(@PathVariable String id) {

        Authentication auth =
                SecurityContextHolder.getContext().getAuthentication();

        UserEntity currentUser = (UserEntity) auth.getPrincipal();

        if (currentUser.getRole() != UserRole.ADMIN) {

            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only Admin can delete tasks");
        }

        if (taskRepository.existsById(id)) {

            taskRepository.deleteById(id);

            return ResponseEntity.ok(
                    "Task deleted successfully"
            );
        }

        return ResponseEntity.notFound().build();
    }

    // =========================================================
    // GET TASKS BY PROJECT
    // =========================================================
    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<TaskEntity>> getTasksByProject(
            @PathVariable String projectId) {

        return ResponseEntity.ok(
                taskRepository.findByProjectId(projectId)
        );
    }

    // =========================================================
    // GET TASKS BY STATUS
    // =========================================================
    @GetMapping("/status/{status}")
    public ResponseEntity<List<TaskEntity>> getTasksByStatus(
            @PathVariable String status) {

        return ResponseEntity.ok(
                taskRepository.findByStatus(status)
        );
    }
}