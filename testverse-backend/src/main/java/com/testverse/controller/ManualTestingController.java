package com.testverse.controller;

import com.testverse.model.ManualTestAccessRequestEntity;
import com.testverse.model.ManualTestSuiteEntity;
import com.testverse.model.UserEntity;
import com.testverse.model.UserRole;
import com.testverse.repository.ManualTestAccessRequestRepository;
import com.testverse.repository.ManualTestSuiteRepository;
import com.testverse.repository.UserRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/manual-testing")
@RequiredArgsConstructor
public class ManualTestingController {

    private final ManualTestSuiteRepository suiteRepository;
    private final ManualTestAccessRequestRepository accessRequestRepository;
    private final UserRepository userRepository;

    // Helper: Resolve authenticated user from SecurityContextHolder
    private UserEntity getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }

        Object principal = auth.getPrincipal();
        if (principal instanceof UserEntity) {
            return (UserEntity) principal;
        }

        String username = null;
        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else if (principal instanceof String) {
            username = (String) principal;
        }

        if (username != null && !username.isBlank()) {
            final String lookupUsername = username;
            return userRepository.findByEmail(lookupUsername)
                    .or(() -> userRepository.findByUsername(lookupUsername))
                    .orElse(null);
        }

        return null;
    }

    // ============================================================
    // 1. GET ALL TEST SUITES (Summary list for all authorized users)
    // ============================================================
    @GetMapping("/suites")
    public ResponseEntity<?> getAllSuites() {
        UserEntity currentUser = getAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }

        List<ManualTestSuiteEntity> suites = suiteRepository.findAllByOrderByCreatedAtDesc();
        List<ManualTestAccessRequestEntity> userRequests = accessRequestRepository.findByUserId(currentUser.getId());
        Map<String, String> requestStatusBySuiteId = userRequests.stream()
                .collect(Collectors.toMap(
                        ManualTestAccessRequestEntity::getSuiteId,
                        ManualTestAccessRequestEntity::getStatus,
                        (existing, replacement) -> replacement
                ));

        List<Map<String, Object>> response = suites.stream().map(suite -> {
            boolean isOwner = currentUser.getId().equals(suite.getOwnerId());
            String requestStatus = requestStatusBySuiteId.getOrDefault(suite.getId(), "NONE");
            boolean canEdit = isOwner || "APPROVED".equalsIgnoreCase(requestStatus);

            Map<String, Object> map = new HashMap<>();
            map.put("id", suite.getId());
            map.put("fileName", suite.getFileName());
            map.put("fileType", suite.getFileType());
            map.put("ownerId", suite.getOwnerId());
            map.put("ownerName", suite.getOwnerName());
            map.put("ownerEmail", suite.getOwnerEmail());
            map.put("totalTestCases", suite.getTotalTestCases() != null ? suite.getTotalTestCases() : 0);
            map.put("createdAt", suite.getCreatedAt());
            map.put("updatedAt", suite.getUpdatedAt());
            map.put("isOwner", isOwner);
            map.put("canEdit", canEdit);
            map.put("requestStatus", requestStatus);
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    // ============================================================
    // 2. GET SUITE DETAILS (Includes full sheetsData)
    // ============================================================
    @GetMapping("/suites/{id}")
    public ResponseEntity<?> getSuiteById(@PathVariable String id) {
        UserEntity currentUser = getAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }

        Optional<ManualTestSuiteEntity> suiteOpt = suiteRepository.findById(id);
        if (suiteOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Test suite not found"));
        }

        ManualTestSuiteEntity suite = suiteOpt.get();
        boolean isOwner = currentUser.getId().equals(suite.getOwnerId());
        Optional<ManualTestAccessRequestEntity> reqOpt = accessRequestRepository.findBySuiteIdAndUserId(id, currentUser.getId());
        String requestStatus = reqOpt.map(ManualTestAccessRequestEntity::getStatus).orElse("NONE");
        boolean canEdit = isOwner || "APPROVED".equalsIgnoreCase(requestStatus);

        Map<String, Object> map = new HashMap<>();
        map.put("id", suite.getId());
        map.put("fileName", suite.getFileName());
        map.put("fileType", suite.getFileType());
        map.put("ownerId", suite.getOwnerId());
        map.put("ownerName", suite.getOwnerName());
        map.put("ownerEmail", suite.getOwnerEmail());
        map.put("totalTestCases", suite.getTotalTestCases() != null ? suite.getTotalTestCases() : 0);
        map.put("sheetsData", suite.getSheetsData());
        map.put("createdAt", suite.getCreatedAt());
        map.put("updatedAt", suite.getUpdatedAt());
        map.put("isOwner", isOwner);
        map.put("canEdit", canEdit);
        map.put("requestStatus", requestStatus);

        return ResponseEntity.ok(map);
    }

    // ============================================================
    // 3. CREATE / UPLOAD TEST SUITE
    // ============================================================
    @Data
    public static class CreateSuiteRequest {
        private String fileName;
        private String fileType;
        private Integer totalTestCases;
        private String sheetsData;
    }

    @PostMapping("/suites")
    public ResponseEntity<?> createSuite(@RequestBody CreateSuiteRequest req) {
        UserEntity currentUser = getAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }

        if (req.getFileName() == null || req.getFileName().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File name is required"));
        }

        ManualTestSuiteEntity suite = ManualTestSuiteEntity.builder()
                .fileName(req.getFileName())
                .fileType(req.getFileType() != null ? req.getFileType() : "xlsx")
                .ownerId(currentUser.getId())
                .ownerName(currentUser.getName() != null ? currentUser.getName() : currentUser.getUsername())
                .ownerEmail(currentUser.getEmail())
                .totalTestCases(req.getTotalTestCases() != null ? req.getTotalTestCases() : 0)
                .sheetsData(req.getSheetsData() != null ? req.getSheetsData() : "[]")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        ManualTestSuiteEntity saved = suiteRepository.save(suite);

        Map<String, Object> map = new HashMap<>();
        map.put("id", saved.getId());
        map.put("fileName", saved.getFileName());
        map.put("fileType", saved.getFileType());
        map.put("ownerId", saved.getOwnerId());
        map.put("ownerName", saved.getOwnerName());
        map.put("ownerEmail", saved.getOwnerEmail());
        map.put("totalTestCases", saved.getTotalTestCases() != null ? saved.getTotalTestCases() : 0);
        map.put("sheetsData", saved.getSheetsData());
        map.put("createdAt", saved.getCreatedAt());
        map.put("updatedAt", saved.getUpdatedAt());
        map.put("isOwner", true);
        map.put("canEdit", true);
        map.put("requestStatus", "NONE");

        return ResponseEntity.status(HttpStatus.CREATED).body(map);
    }

    // ============================================================
    // 4. UPDATE TEST SUITE (Save changes to spreadsheet data / file name)
    // Only owner or users with APPROVED access request can edit.
    // ============================================================
    @Data
    public static class UpdateSuiteRequest {
        private String fileName;
        private String sheetsData;
        private Integer totalTestCases;
    }

    @PutMapping("/suites/{id}")
    public ResponseEntity<?> updateSuite(@PathVariable String id, @RequestBody UpdateSuiteRequest req) {
        UserEntity currentUser = getAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }

        Optional<ManualTestSuiteEntity> suiteOpt = suiteRepository.findById(id);
        if (suiteOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Test suite not found"));
        }

        ManualTestSuiteEntity suite = suiteOpt.get();
        boolean isOwner = currentUser.getId().equals(suite.getOwnerId());
        boolean isApproved = accessRequestRepository.findBySuiteIdAndUserId(id, currentUser.getId())
                .map(r -> "APPROVED".equalsIgnoreCase(r.getStatus()))
                .orElse(false);

        // Security check: strictly owner or approved editor only
        if (!isOwner && !isApproved) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied: You do not have permission to edit this spreadsheet"));
        }

        if (req.getFileName() != null && !req.getFileName().isBlank()) {
            suite.setFileName(req.getFileName().trim());
        }
        if (req.getSheetsData() != null) {
            suite.setSheetsData(req.getSheetsData());
        }
        if (req.getTotalTestCases() != null) {
            suite.setTotalTestCases(req.getTotalTestCases());
        }
        suite.setUpdatedAt(LocalDateTime.now());

        ManualTestSuiteEntity updated = suiteRepository.save(suite);

        Map<String, Object> map = new HashMap<>();
        map.put("id", updated.getId());
        map.put("fileName", updated.getFileName());
        map.put("fileType", updated.getFileType());
        map.put("ownerId", updated.getOwnerId());
        map.put("ownerName", updated.getOwnerName());
        map.put("ownerEmail", updated.getOwnerEmail());
        map.put("totalTestCases", updated.getTotalTestCases() != null ? updated.getTotalTestCases() : 0);
        map.put("sheetsData", updated.getSheetsData());
        map.put("createdAt", updated.getCreatedAt());
        map.put("updatedAt", updated.getUpdatedAt());
        map.put("isOwner", isOwner);
        map.put("canEdit", true);
        map.put("requestStatus", isOwner ? "NONE" : "APPROVED");

        return ResponseEntity.ok(map);
    }

    // ============================================================
    // 5. DELETE TEST SUITE (Owner or Admin only)
    // ============================================================
    @DeleteMapping("/suites/{id}")
    public ResponseEntity<?> deleteSuite(@PathVariable String id) {
        UserEntity currentUser = getAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }

        Optional<ManualTestSuiteEntity> suiteOpt = suiteRepository.findById(id);
        if (suiteOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Test suite not found"));
        }

        ManualTestSuiteEntity suite = suiteOpt.get();
        boolean isOwner = currentUser.getId().equals(suite.getOwnerId());
        boolean isAdmin = currentUser.getRole() == UserRole.ADMIN;

        if (!isOwner && !isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied: Only the owner or admin can delete this test suite"));
        }

        // Delete associated access requests
        List<ManualTestAccessRequestEntity> requests = accessRequestRepository.findBySuiteId(id);
        accessRequestRepository.deleteAll(requests);

        suiteRepository.delete(suite);
        return ResponseEntity.ok(Map.of("message", "Test suite deleted successfully"));
    }

    // ============================================================
    // 6. REQUEST EDIT ACCESS
    // ============================================================
    @PostMapping("/suites/{id}/request-access")
    public ResponseEntity<?> requestEditAccess(@PathVariable String id) {
        UserEntity currentUser = getAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }

        Optional<ManualTestSuiteEntity> suiteOpt = suiteRepository.findById(id);
        if (suiteOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Test suite not found"));
        }

        ManualTestSuiteEntity suite = suiteOpt.get();
        if (currentUser.getId().equals(suite.getOwnerId())) {
            return ResponseEntity.badRequest().body(Map.of("error", "You are the owner and already have edit access"));
        }

        Optional<ManualTestAccessRequestEntity> existingReq = accessRequestRepository.findBySuiteIdAndUserId(id, currentUser.getId());
        if (existingReq.isPresent()) {
            ManualTestAccessRequestEntity req = existingReq.get();
            if ("PENDING".equalsIgnoreCase(req.getStatus())) {
                return ResponseEntity.ok(req);
            }
            if ("APPROVED".equalsIgnoreCase(req.getStatus())) {
                return ResponseEntity.ok(req);
            }
            // If REJECTED, permit re-requesting
            req.setStatus("PENDING");
            req.setUpdatedAt(LocalDateTime.now());
            ManualTestAccessRequestEntity updated = accessRequestRepository.save(req);
            return ResponseEntity.ok(updated);
        }

        ManualTestAccessRequestEntity newRequest = ManualTestAccessRequestEntity.builder()
                .suiteId(suite.getId())
                .suiteName(suite.getFileName())
                .userId(currentUser.getId())
                .userName(currentUser.getName() != null ? currentUser.getName() : currentUser.getUsername())
                .userRole(currentUser.getRole() != null ? currentUser.getRole().name() : "TESTER")
                .ownerId(suite.getOwnerId())
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        ManualTestAccessRequestEntity saved = accessRequestRepository.save(newRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // ============================================================
    // 7. GET ACCESS REQUESTS FOR SUITES OWNED BY CURRENT USER
    // ============================================================
    @GetMapping("/access-requests/owner")
    public ResponseEntity<?> getOwnerAccessRequests() {
        UserEntity currentUser = getAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }

        List<ManualTestAccessRequestEntity> requests = accessRequestRepository.findByOwnerIdOrderByCreatedAtDesc(currentUser.getId());
        return ResponseEntity.ok(requests);
    }

    // ============================================================
    // 8. APPROVE / REJECT ACCESS REQUEST
    // Only owner of the suite (or admin) can approve/reject.
    // ============================================================
    @Data
    public static class UpdateStatusRequest {
        private String status; // "APPROVED" or "REJECTED"
    }

    @PutMapping("/access-requests/{requestId}/status")
    public ResponseEntity<?> updateAccessRequestStatus(
            @PathVariable String requestId,
            @RequestBody UpdateStatusRequest body) {

        UserEntity currentUser = getAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }

        Optional<ManualTestAccessRequestEntity> reqOpt = accessRequestRepository.findById(requestId);
        if (reqOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Access request not found"));
        }

        ManualTestAccessRequestEntity request = reqOpt.get();
        boolean isOwner = currentUser.getId().equals(request.getOwnerId());
        boolean isAdmin = currentUser.getRole() == UserRole.ADMIN;

        if (!isOwner && !isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied: Only the spreadsheet owner can approve or reject access requests"));
        }

        String newStatus = body.getStatus() != null ? body.getStatus().toUpperCase().trim() : "";
        if (!"APPROVED".equals(newStatus) && !"REJECTED".equals(newStatus)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid status. Must be APPROVED or REJECTED"));
        }

        request.setStatus(newStatus);
        request.setUpdatedAt(LocalDateTime.now());
        ManualTestAccessRequestEntity updated = accessRequestRepository.save(request);

        return ResponseEntity.ok(updated);
    }
}
