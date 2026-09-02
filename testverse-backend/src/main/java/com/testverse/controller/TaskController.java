    package com.testverse.controller;

    import com.testverse.model.TaskEntity;
    import com.testverse.model.UserEntity;
    import com.testverse.model.UserRole;
    import com.testverse.repository.TaskRepository;
    import lombok.RequiredArgsConstructor;
    import org.springframework.http.HttpStatus;
    import org.springframework.http.ResponseEntity;
    import org.springframework.security.core.Authentication;
    import org.springframework.security.core.context.SecurityContextHolder;
    import org.springframework.web.bind.annotation.*;

    import java.time.LocalDateTime;
    import java.util.List;

    @RestController
    @RequestMapping("/api/tasks")
    @RequiredArgsConstructor
    public class TaskController {

        private final TaskRepository taskRepository;

        // ✅ Get all tasks - Everyone can view
        @GetMapping
        public ResponseEntity<List<TaskEntity>> getAllTasks() {
            return ResponseEntity.ok(taskRepository.findAll());
        }

        // ✅ Get task by ID - Everyone can view
        @GetMapping("/{id}")
        public ResponseEntity<?> getTaskById(@PathVariable Long id) {
            return taskRepository.findById(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        }

        // ✅ Create Task - ADMIN, DEVELOPER, TESTER
        @PostMapping
        public ResponseEntity<?> createTask(@RequestBody TaskEntity task) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            UserEntity currentUser = (UserEntity) auth.getPrincipal();

            if (currentUser.getRole() != UserRole.ADMIN &&
                    currentUser.getRole() != UserRole.DEVELOPER &&
                    currentUser.getRole() != UserRole.TESTER) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Only Admin, Developer, and Tester can create tasks");
            }

            task.setCreatedAt(LocalDateTime.now());
            task.setUpdatedAt(LocalDateTime.now());
            if (task.getStatus() == null) task.setStatus("PENDING");
            if (task.getPriority() == null) task.setPriority("MEDIUM");

            TaskEntity savedTask = taskRepository.save(task);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedTask);
        }

        // ✅ Update Task - ADMIN and DEVELOPER
        @PutMapping("/{id}")
        public ResponseEntity<?> updateTask(@PathVariable Long id, @RequestBody TaskEntity taskDetails) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            UserEntity currentUser = (UserEntity) auth.getPrincipal();

            if (currentUser.getRole() != UserRole.ADMIN && currentUser.getRole() != UserRole.DEVELOPER) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Only Admin and Developer can update tasks");
            }

            return taskRepository.findById(id)
                    .map(task -> {
                        task.setTitle(taskDetails.getTitle());
                        task.setDescription(taskDetails.getDescription());
                        task.setStatus(taskDetails.getStatus());
                        task.setPriority(taskDetails.getPriority());
                        task.setDueDate(taskDetails.getDueDate());
                        task.setAssignedStudentId(taskDetails.getAssignedStudentId());
                        task.setModuleName(taskDetails.getModuleName());
                        task.setInstructions(taskDetails.getInstructions());
                        task.setUpdatedAt(LocalDateTime.now());
                        return ResponseEntity.ok(taskRepository.save(task));
                    })
                    .orElse(ResponseEntity.notFound().build());
        }

        // ✅ Delete Task - Only ADMIN
        @DeleteMapping("/{id}")
        public ResponseEntity<?> deleteTask(@PathVariable Long id) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            UserEntity currentUser = (UserEntity) auth.getPrincipal();

            if (currentUser.getRole() != UserRole.ADMIN) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Only Admin can delete tasks");
            }

            if (taskRepository.existsById(id)) {
                taskRepository.deleteById(id);
                return ResponseEntity.ok("Task deleted successfully");
            }
            return ResponseEntity.notFound().build();
        }

        // ✅ Get tasks by project - Everyone can view
        @GetMapping("/project/{projectId}")
        public ResponseEntity<List<TaskEntity>> getTasksByProject(@PathVariable Long projectId) {
            return ResponseEntity.ok(taskRepository.findByProjectId(projectId));
        }

        // ✅ Get tasks by status - Everyone can view
        @GetMapping("/status/{status}")
        public ResponseEntity<List<TaskEntity>> getTasksByStatus(@PathVariable String status) {
            return ResponseEntity.ok(taskRepository.findByStatus(status));
        }
    }