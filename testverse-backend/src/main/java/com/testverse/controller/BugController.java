package com.testverse.controller;

import com.testverse.model.BugReportEntity;
import com.testverse.repository.BugReportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bugs")
public class BugController {

    @Autowired
    private BugReportRepository bugReportRepository;

    @GetMapping
    public ResponseEntity<?> getAllBugs() {
        try {
            System.out.println("✅✅✅ GET /api/bugs CALLED! ✅✅✅");
            List<BugReportEntity> bugs = bugReportRepository.findAll();
            return ResponseEntity.ok(bugs);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to fetch bugs: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping
    public ResponseEntity<?> createBug(@RequestBody BugReportEntity bug) {
        try {
            System.out.println("✅✅✅ POST /api/bugs CALLED! ✅✅✅");
            System.out.println("   Title: " + bug.getTitle());

            // Validate required fields
            if (bug.getTitle() == null || bug.getTitle().trim().isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Title is required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            if (bug.getStatus() == null || bug.getStatus().trim().isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Status is required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            if (bug.getPriority() == null || bug.getPriority().trim().isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Priority is required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            if (bug.getSeverity() == null || bug.getSeverity().trim().isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Severity is required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            if (bug.getCreatedAt() == null) {
                bug.setCreatedAt(LocalDateTime.now());
            }
            if (bug.getUpdatedAt() == null) {
                bug.setUpdatedAt(LocalDateTime.now());
            }

            BugReportEntity savedBug = bugReportRepository.save(bug);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedBug);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to create bug: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateBugStatus(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            System.out.println("✅✅✅ PATCH /api/bugs/" + id + "/status CALLED! ✅✅✅");

            return bugReportRepository.findById(id)
                    .map(bug -> {
                        String newStatus = request.get("status");
                        if (newStatus == null || newStatus.trim().isEmpty()) {
                            Map<String, String> error = new HashMap<>();
                            error.put("error", "Status is required");
                            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
                        }
                        bug.setStatus(newStatus);
                        bug.setUpdatedAt(LocalDateTime.now());
                        return ResponseEntity.ok(bugReportRepository.save(bug));
                    })
                    .orElseGet(() -> {
                        Map<String, String> error = new HashMap<>();
                        error.put("error", "Bug not found with ID: " + id);
                        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
                    });
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to update bug status: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBug(@PathVariable Long id) {
        try {
            System.out.println("✅✅✅ DELETE /api/bugs/" + id + " CALLED! ✅✅✅");

            if (!bugReportRepository.existsById(id)) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Bug not found with ID: " + id);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }

            bugReportRepository.deleteById(id);
            Map<String, String> success = new HashMap<>();
            success.put("message", "Bug deleted successfully");
            return ResponseEntity.ok(success);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to delete bug: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}