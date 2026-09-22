package com.testverse.controller;

import com.testverse.model.TaskEntity;
import com.testverse.model.UserEntity;
import com.testverse.model.UserRole;
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

        // If Mentor creates the task,
        // store that Mentor as the task creator.
        if (currentUser.getRole() == UserRole.MENTOR) {
            task.setMentorId(currentUser.getId());
        }

        if (task.getStatus() == null) {
            task.setStatus("To Do");
        }

        if (task.getPriority() == null) {
            task.setPriority("Medium");
        }

        TaskEntity savedTask = taskRepository.save(task);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(savedTask);
    }

    // =========================================================
    // UPDATE TASK
    //
    // ADMIN + MENTOR + DEVELOPER + TESTER
    //
    // Later we will restrict TESTER/DEVELOPER to their
    // assigned tasks only.
    // =========================================================
    @PutMapping("/{id}")
    public ResponseEntity<?> updateTask(
            @PathVariable String id,
            @RequestBody TaskEntity taskDetails) {

        Authentication auth =
                SecurityContextHolder.getContext().getAuthentication();

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

                    task.setTitle(taskDetails.getTitle());
                    task.setDescription(taskDetails.getDescription());
                    task.setStatus(taskDetails.getStatus());
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

                    return ResponseEntity.ok(
                            taskRepository.save(task)
                    );
                })
                .orElse(ResponseEntity.notFound().build());
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