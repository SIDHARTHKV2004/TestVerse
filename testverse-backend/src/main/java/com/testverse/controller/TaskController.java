package com.testverse.controller;

import com.testverse.model.TaskEntity;
import com.testverse.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    @Autowired
    private TaskRepository taskRepository;

    @GetMapping
    public ResponseEntity<?> getAllTasks() {
        try {
            System.out.println("✅✅✅ GET /api/tasks CALLED! ✅✅✅");
            List<TaskEntity> tasks = taskRepository.findAll();
            return ResponseEntity.ok(tasks);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to fetch tasks: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping
    public ResponseEntity<?> createTask(@RequestBody TaskEntity task) {
        try {
            System.out.println("✅✅✅ POST /api/tasks CALLED! ✅✅✅");
            System.out.println("   Title: " + task.getTitle());

            // Validate required fields
            if (task.getTitle() == null || task.getTitle().trim().isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Title is required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            if (task.getStatus() == null || task.getStatus().trim().isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Status is required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            if (task.getPriority() == null || task.getPriority().trim().isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Priority is required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            if (task.getDueDate() == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Due date is required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            // Set defaults if not provided
            if (task.getCreatedAt() == null) {
                task.setCreatedAt(LocalDateTime.now());
            }
            if (task.getUpdatedAt() == null) {
                task.setUpdatedAt(LocalDateTime.now());
            }

            TaskEntity savedTask = taskRepository.save(task);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedTask);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to create task: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTaskById(@PathVariable Long id) {
        try {
            System.out.println("✅✅✅ GET /api/tasks/" + id + " CALLED! ✅✅✅");
            TaskEntity task = taskRepository.findById(id).orElse(null);

            if (task == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Task not found with ID: " + id);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }

            return ResponseEntity.ok(task);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to fetch task: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTask(@PathVariable Long id, @RequestBody TaskEntity task) {
        try {
            System.out.println("✅✅✅ PUT /api/tasks/" + id + " CALLED! ✅✅✅");

            if (!taskRepository.existsById(id)) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Task not found with ID: " + id);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }

            // Validate required fields
            if (task.getTitle() == null || task.getTitle().trim().isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Title is required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            task.setId(id);
            task.setUpdatedAt(LocalDateTime.now());
            TaskEntity updatedTask = taskRepository.save(task);
            return ResponseEntity.ok(updatedTask);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to update task: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTask(@PathVariable Long id) {
        try {
            System.out.println("✅✅✅ DELETE /api/tasks/" + id + " CALLED! ✅✅✅");

            if (!taskRepository.existsById(id)) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Task not found with ID: " + id);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }

            taskRepository.deleteById(id);
            Map<String, String> success = new HashMap<>();
            success.put("message", "Task deleted successfully");
            return ResponseEntity.ok(success);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to delete task: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // Get tasks by student
    @GetMapping("/student/{studentId}")
    public ResponseEntity<?> getTasksByStudent(@PathVariable Long studentId) {
        try {
            System.out.println("✅✅✅ GET /api/tasks/student/" + studentId + " CALLED! ✅✅✅");
            List<TaskEntity> tasks = taskRepository.findByAssignedStudentId(studentId);
            return ResponseEntity.ok(tasks);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to fetch tasks for student: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // Get tasks by status
    @GetMapping("/status/{status}")
    public ResponseEntity<?> getTasksByStatus(@PathVariable String status) {
        try {
            System.out.println("✅✅✅ GET /api/tasks/status/" + status + " CALLED! ✅✅✅");
            List<TaskEntity> tasks = taskRepository.findByStatus(status);
            return ResponseEntity.ok(tasks);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to fetch tasks by status: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}