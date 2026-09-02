package com.testverse.controller;

import com.testverse.model.BugReportEntity;
import com.testverse.model.UserEntity;
import com.testverse.model.UserRole;
import com.testverse.repository.BugReportRepository;
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

    // ✅ Get all bugs - Everyone can view
    @GetMapping
    public ResponseEntity<List<BugReportEntity>> getAllBugs() {
        return ResponseEntity.ok(bugReportRepository.findAll());
    }

    // ✅ Get bug by ID - Everyone can view
    @GetMapping("/{id}")
    public ResponseEntity<?> getBugById(@PathVariable Long id) {
        return bugReportRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ✅ Create Bug - Only ADMIN and TESTER
    @PostMapping
    public ResponseEntity<?> createBug(@RequestBody BugReportEntity bug) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserEntity currentUser = (UserEntity) auth.getPrincipal();

        if (currentUser.getRole() != UserRole.ADMIN && currentUser.getRole() != UserRole.TESTER) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only Admin and Tester can create bugs");
        }

        bug.setCreatedAt(LocalDateTime.now());
        bug.setUpdatedAt(LocalDateTime.now());
        if (bug.getStatus() == null) bug.setStatus("OPEN");
        if (bug.getSeverity() == null) bug.setSeverity("MEDIUM");
        if (bug.getPriority() == null) bug.setPriority("MEDIUM");

        // Set reporter ID if not set
        if (bug.getReporterId() == null) {
            bug.setReporterId(currentUser.getId());
            bug.setReporterName(currentUser.getName());
        }

        BugReportEntity savedBug = bugReportRepository.save(bug);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedBug);
    }

    // ✅ Update Bug Details - Only ADMIN
    @PutMapping("/{id}")
    public ResponseEntity<?> updateBug(@PathVariable Long id, @RequestBody BugReportEntity bugDetails) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserEntity currentUser = (UserEntity) auth.getPrincipal();

        if (currentUser.getRole() != UserRole.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only Admin can update bug details");
        }

        return bugReportRepository.findById(id)
                .map(bug -> {
                    bug.setTitle(bugDetails.getTitle());
                    bug.setDescription(bugDetails.getDescription());
                    bug.setSeverity(bugDetails.getSeverity());
                    bug.setPriority(bugDetails.getPriority());
                    bug.setAssigneeId(bugDetails.getAssigneeId());
                    bug.setAssigneeName(bugDetails.getAssigneeName());
                    bug.setUpdatedAt(LocalDateTime.now());
                    return ResponseEntity.ok(bugReportRepository.save(bug));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ✅ Update Bug Status - Only ADMIN and DEVELOPER
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateBugStatus(@PathVariable Long id, @RequestBody Map<String, String> statusUpdate) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserEntity currentUser = (UserEntity) auth.getPrincipal();

        if (currentUser.getRole() != UserRole.ADMIN && currentUser.getRole() != UserRole.DEVELOPER) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only Admin and Developer can update bug status");
        }

        return bugReportRepository.findById(id)
                .map(bug -> {
                    String newStatus = statusUpdate.get("status");
                    if (newStatus == null || newStatus.isEmpty()) {
                        return ResponseEntity.badRequest().body("Status is required");
                    }
                    bug.setStatus(newStatus);
                    bug.setUpdatedAt(LocalDateTime.now());
                    return ResponseEntity.ok(bugReportRepository.save(bug));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ✅ Delete Bug - Only ADMIN and TESTER (so testers can delete their own mistakes)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBug(@PathVariable Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserEntity currentUser = (UserEntity) auth.getPrincipal();

        if (currentUser.getRole() != UserRole.ADMIN && currentUser.getRole() != UserRole.TESTER) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only Admin and Tester can delete bugs");
        }

        return bugReportRepository.findById(id)
                .map(bug -> {
                    // If Tester, only allow deletion if they created it
                    if (currentUser.getRole() == UserRole.TESTER) {
                        if (!Objects.equals(bug.getReporterId(), currentUser.getId())) {
                            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                    .body("Testers can only delete bugs they created");
                        }
                    }
                    bugReportRepository.deleteById(id);
                    return ResponseEntity.ok("Bug deleted successfully");
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ✅ Get bugs by status - Everyone can view
    @GetMapping("/status/{status}")
    public ResponseEntity<List<BugReportEntity>> getBugsByStatus(@PathVariable String status) {
        return ResponseEntity.ok(bugReportRepository.findByStatus(status));
    }

    // ✅ Get bugs by reporter - Everyone can view
    @GetMapping("/reporter/{reporterId}")
    public ResponseEntity<List<BugReportEntity>> getBugsByReporter(@PathVariable Long reporterId) {
        return ResponseEntity.ok(bugReportRepository.findByReporterId(reporterId));
    }

    // ✅ Get bugs by assignee - Everyone can view
    @GetMapping("/assignee/{assigneeId}")
    public ResponseEntity<List<BugReportEntity>> getBugsByAssignee(@PathVariable Long assigneeId) {
        return ResponseEntity.ok(bugReportRepository.findByAssigneeId(assigneeId));
    }
}