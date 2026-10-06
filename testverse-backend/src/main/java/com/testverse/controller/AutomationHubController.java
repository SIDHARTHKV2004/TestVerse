package com.testverse.controller;

import com.testverse.model.*;
import com.testverse.repository.*;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/automation")
@RequiredArgsConstructor
public class AutomationHubController {

    private final AutomationProjectRepository projectRepository;
    private final AutomationFileRepository fileRepository;
    private final AutomationFileVersionRepository versionRepository;
    private final AutomationAccessRequestRepository accessRequestRepository;
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

    // Role Guard: DEVELOPER and DEVELOPMENT MENTOR are strictly FORBIDDEN from AutomationHub
    private boolean isDeveloperRestricted(UserEntity user) {
        if (user == null) return false;
        if (user.getRole() == UserRole.DEVELOPER) return true;
        if (user.getRole() == UserRole.MENTOR && user.canMentorDeveloper() && !user.canMentorTester()) return true;
        return false;
    }

    // Helper: Determine if user can edit given automation project
    private boolean checkCanEdit(AutomationProjectEntity project, UserEntity user) {
        if (project == null || user == null) return false;
        boolean isOwner = user.getId().equals(project.getOwnerId());
        if (isOwner) return true;

        return accessRequestRepository.findByAutomationProjectIdAndUserId(project.getId(), user.getId())
                .map(r -> "APPROVED".equalsIgnoreCase(r.getStatus()))
                .orElse(false);
    }

    // ============================================================
    // 1. AUTOMATION PROJECTS ENDPOINTS
    // ============================================================

    @GetMapping("/projects")
    public ResponseEntity<?> getAllProjects() {
        UserEntity currentUser = getAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        if (isDeveloperRestricted(currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied: Developer role cannot access AutomationHub. Please use DevelopingHub."));
        }

        List<AutomationProjectEntity> projects = projectRepository.findAllByOrderByCreatedAtDesc();
        List<AutomationAccessRequestEntity> userRequests = accessRequestRepository.findByUserId(currentUser.getId());
        Map<String, String> requestStatusByProjectId = userRequests.stream()
                .collect(Collectors.toMap(
                        AutomationAccessRequestEntity::getAutomationProjectId,
                        AutomationAccessRequestEntity::getStatus,
                        (existing, replacement) -> replacement
                ));

        List<Map<String, Object>> response = projects.stream().map(project -> {
            boolean isOwner = currentUser.getId().equals(project.getOwnerId());
            String requestStatus = requestStatusByProjectId.getOrDefault(project.getId(), "NONE");
            boolean canEdit = isOwner || "APPROVED".equalsIgnoreCase(requestStatus);

            Map<String, Object> map = new HashMap<>();
            map.put("id", project.getId());
            map.put("name", project.getName());
            map.put("description", project.getDescription());
            map.put("framework", project.getFramework());
            map.put("language", project.getLanguage());
            map.put("ownerId", project.getOwnerId());
            map.put("ownerName", project.getOwnerName());
            map.put("ownerEmail", project.getOwnerEmail());
            map.put("testverseProjectId", project.getTestverseProjectId());
            map.put("testverseProjectName", project.getTestverseProjectName());
            map.put("totalFiles", project.getTotalFiles() != null ? project.getTotalFiles() : 0);
            map.put("totalPackages", project.getTotalPackages() != null ? project.getTotalPackages() : 0);
            map.put("createdAt", project.getCreatedAt());
            map.put("updatedAt", project.getUpdatedAt());
            map.put("isOwner", isOwner);
            map.put("canEdit", canEdit);
            map.put("requestStatus", requestStatus);
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/projects/{projectId}")
    public ResponseEntity<?> getProjectById(@PathVariable String projectId) {
        UserEntity currentUser = getAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        if (isDeveloperRestricted(currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied: Developer role cannot access AutomationHub. Please use DevelopingHub."));
        }

        Optional<AutomationProjectEntity> projOpt = projectRepository.findById(projectId);
        if (projOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Automation project not found"));
        }

        AutomationProjectEntity project = projOpt.get();
        boolean isOwner = currentUser.getId().equals(project.getOwnerId());
        Optional<AutomationAccessRequestEntity> reqOpt = accessRequestRepository.findByAutomationProjectIdAndUserId(projectId, currentUser.getId());
        String requestStatus = reqOpt.map(AutomationAccessRequestEntity::getStatus).orElse("NONE");
        boolean canEdit = isOwner || "APPROVED".equalsIgnoreCase(requestStatus);

        Map<String, Object> map = new HashMap<>();
        map.put("id", project.getId());
        map.put("name", project.getName());
        map.put("description", project.getDescription());
        map.put("framework", project.getFramework());
        map.put("language", project.getLanguage());
        map.put("ownerId", project.getOwnerId());
        map.put("ownerName", project.getOwnerName());
        map.put("ownerEmail", project.getOwnerEmail());
        map.put("testverseProjectId", project.getTestverseProjectId());
        map.put("testverseProjectName", project.getTestverseProjectName());
        map.put("totalFiles", project.getTotalFiles() != null ? project.getTotalFiles() : 0);
        map.put("totalPackages", project.getTotalPackages() != null ? project.getTotalPackages() : 0);
        map.put("createdAt", project.getCreatedAt());
        map.put("updatedAt", project.getUpdatedAt());
        map.put("isOwner", isOwner);
        map.put("canEdit", canEdit);
        map.put("requestStatus", requestStatus);

        return ResponseEntity.ok(map);
    }

    @Data
    public static class CreateProjectRequest {
        private String name;
        private String description;
        private String framework;
        private String language;
        private String testverseProjectId;
        private String testverseProjectName;
    }

    @PostMapping("/projects")
    public ResponseEntity<?> createProject(@RequestBody CreateProjectRequest req) {
        UserEntity currentUser = getAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        if (isDeveloperRestricted(currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied: Developer role cannot access AutomationHub. Please use DevelopingHub."));
        }

        if (req.getName() == null || req.getName().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Project name is required"));
        }

        AutomationProjectEntity project = AutomationProjectEntity.builder()
                .name(req.getName().trim())
                .description(req.getDescription())
                .framework(req.getFramework() != null ? req.getFramework() : "Playwright")
                .language(req.getLanguage() != null ? req.getLanguage() : "Java")
                .ownerId(currentUser.getId())
                .ownerName(currentUser.getName() != null ? currentUser.getName() : currentUser.getUsername())
                .ownerEmail(currentUser.getEmail())
                .testverseProjectId(req.getTestverseProjectId())
                .testverseProjectName(req.getTestverseProjectName())
                .totalFiles(0)
                .totalPackages(0)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        AutomationProjectEntity saved = projectRepository.save(project);

        Map<String, Object> map = new HashMap<>();
        map.put("id", saved.getId());
        map.put("name", saved.getName());
        map.put("description", saved.getDescription());
        map.put("framework", saved.getFramework());
        map.put("language", saved.getLanguage());
        map.put("ownerId", saved.getOwnerId());
        map.put("ownerName", saved.getOwnerName());
        map.put("ownerEmail", saved.getOwnerEmail());
        map.put("testverseProjectId", saved.getTestverseProjectId());
        map.put("testverseProjectName", saved.getTestverseProjectName());
        map.put("totalFiles", 0);
        map.put("totalPackages", 0);
        map.put("createdAt", saved.getCreatedAt());
        map.put("updatedAt", saved.getUpdatedAt());
        map.put("isOwner", true);
        map.put("canEdit", true);
        map.put("requestStatus", "NONE");

        return ResponseEntity.status(HttpStatus.CREATED).body(map);
    }

    @Data
    public static class UpdateProjectRequest {
        private String name;
        private String description;
        private String framework;
        private String language;
        private String testverseProjectId;
        private String testverseProjectName;
    }

    @PutMapping("/projects/{projectId}")
    public ResponseEntity<?> updateProject(@PathVariable String projectId, @RequestBody UpdateProjectRequest req) {
        UserEntity currentUser = getAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        if (isDeveloperRestricted(currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied: Developer role cannot access AutomationHub. Please use DevelopingHub."));
        }

        Optional<AutomationProjectEntity> projOpt = projectRepository.findById(projectId);
        if (projOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Automation project not found"));
        }

        AutomationProjectEntity project = projOpt.get();
        if (!checkCanEdit(project, currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied: You do not have permission to edit this project"));
        }

        if (req.getName() != null && !req.getName().isBlank()) {
            project.setName(req.getName().trim());
        }
        if (req.getDescription() != null) {
            project.setDescription(req.getDescription());
        }
        if (req.getFramework() != null) {
            project.setFramework(req.getFramework());
        }
        if (req.getLanguage() != null) {
            project.setLanguage(req.getLanguage());
        }
        if (req.getTestverseProjectId() != null) {
            project.setTestverseProjectId(req.getTestverseProjectId());
        }
        if (req.getTestverseProjectName() != null) {
            project.setTestverseProjectName(req.getTestverseProjectName());
        }
        project.setUpdatedAt(LocalDateTime.now());

        AutomationProjectEntity updated = projectRepository.save(project);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/projects/{projectId}")
    @Transactional
    public ResponseEntity<?> deleteProject(@PathVariable String projectId) {
        UserEntity currentUser = getAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        if (isDeveloperRestricted(currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied: Developer role cannot access AutomationHub. Please use DevelopingHub."));
        }

        Optional<AutomationProjectEntity> projOpt = projectRepository.findById(projectId);
        if (projOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Automation project not found"));
        }

        AutomationProjectEntity project = projOpt.get();
        boolean isOwner = currentUser.getId().equals(project.getOwnerId());
        boolean isAdmin = currentUser.getRole() == UserRole.ADMIN;

        if (!isOwner && !isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied: Only the project owner can delete this project"));
        }

        // Clean up files, versions, and access requests
        versionRepository.deleteByAutomationProjectId(projectId);
        fileRepository.deleteByAutomationProjectId(projectId);
        accessRequestRepository.deleteByAutomationProjectId(projectId);
        projectRepository.delete(project);

        return ResponseEntity.ok(Map.of("message", "Automation project deleted successfully"));
    }

    // ============================================================
    // 2. SOURCE CODE FILES & IDE SYNCHRONIZATION
    // ============================================================

    @GetMapping("/projects/{projectId}/files")
    public ResponseEntity<?> getProjectFiles(@PathVariable String projectId) {
        UserEntity currentUser = getAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        if (isDeveloperRestricted(currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied: Developer role cannot access AutomationHub. Please use DevelopingHub."));
        }

        Optional<AutomationProjectEntity> projOpt = projectRepository.findById(projectId);
        if (projOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Automation project not found"));
        }

        List<AutomationFileEntity> files = fileRepository.findByAutomationProjectIdOrderByFilePathAsc(projectId);
        return ResponseEntity.ok(files);
    }

    @GetMapping("/files/{fileId}")
    public ResponseEntity<?> getFileById(@PathVariable String fileId) {
        UserEntity currentUser = getAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        if (isDeveloperRestricted(currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied: Developer role cannot access AutomationHub. Please use DevelopingHub."));
        }

        Optional<AutomationFileEntity> fileOpt = fileRepository.findById(fileId);
        if (fileOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "File not found"));
        }

        return ResponseEntity.ok(fileOpt.get());
    }

    @Data
    public static class UploadFileInput {
        private String fileName;
        private String filePath; // Relative path e.g. "src/test/java/page/LoginPage.java"
        private String packagePath;
        private String language;
        private String content;
        private String commitMessage;
        private Integer expectedVersion; // For optimistic locking / conflict detection
    }

    @Data
    public static class BatchUploadRequest {
        private List<UploadFileInput> files;
        private String commitMessage;
    }

    // Upload / Synchronize Source Files (Single or Batch from IDE or Web UI)
    @PostMapping("/projects/{projectId}/files")
    @Transactional
    public ResponseEntity<?> uploadFiles(
            @PathVariable String projectId,
            @RequestBody BatchUploadRequest req) {

        UserEntity currentUser = getAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        if (isDeveloperRestricted(currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied: Developer role cannot access AutomationHub. Please use DevelopingHub."));
        }

        Optional<AutomationProjectEntity> projOpt = projectRepository.findById(projectId);
        if (projOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Automation project not found"));
        }

        AutomationProjectEntity project = projOpt.get();
        if (!checkCanEdit(project, currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied: You do not have edit permission for this automation project"));
        }

        if (req.getFiles() == null || req.getFiles().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No files provided for upload"));
        }

        String defaultCommitMsg = req.getCommitMessage() != null && !req.getCommitMessage().isBlank()
                ? req.getCommitMessage()
                : "Source synchronization";

        List<AutomationFileEntity> savedFiles = new ArrayList<>();
        List<Map<String, Object>> conflicts = new ArrayList<>();

        for (UploadFileInput fileInput : req.getFiles()) {
            if (fileInput.getFilePath() == null || fileInput.getFilePath().isBlank()) {
                continue;
            }

            String normalizedPath = fileInput.getFilePath().replace('\\', '/').trim();
            while (normalizedPath.startsWith("/")) {
                normalizedPath = normalizedPath.substring(1);
            }

            String derivedFileName = fileInput.getFileName();
            if (derivedFileName == null || derivedFileName.isBlank()) {
                int lastSlash = normalizedPath.lastIndexOf('/');
                derivedFileName = lastSlash >= 0 ? normalizedPath.substring(lastSlash + 1) : normalizedPath;
            }

            String derivedPackage = fileInput.getPackagePath();
            if (derivedPackage == null || derivedPackage.isBlank()) {
                int lastSlash = normalizedPath.lastIndexOf('/');
                derivedPackage = lastSlash >= 0 ? normalizedPath.substring(0, lastSlash) : "";
            }

            String derivedLanguage = fileInput.getLanguage();
            if (derivedLanguage == null || derivedLanguage.isBlank()) {
                derivedLanguage = detectLanguage(derivedFileName);
            }

            Optional<AutomationFileEntity> existingOpt =
                    fileRepository.findByAutomationProjectIdAndFilePath(projectId, normalizedPath);

            String commitMsg = fileInput.getCommitMessage() != null && !fileInput.getCommitMessage().isBlank()
                    ? fileInput.getCommitMessage()
                    : defaultCommitMsg;

            if (existingOpt.isPresent()) {
                AutomationFileEntity existing = existingOpt.get();

                // Optimistic concurrency check if expectedVersion provided
                if (fileInput.getExpectedVersion() != null && existing.getVersion() > fileInput.getExpectedVersion()) {
                    conflicts.add(Map.of(
                            "filePath", normalizedPath,
                            "serverVersion", existing.getVersion(),
                            "expectedVersion", fileInput.getExpectedVersion(),
                            "message", "Conflict detected: Server has newer version."
                    ));
                    continue;
                }

                int newVersion = existing.getVersion() + 1;
                existing.setContent(fileInput.getContent() != null ? fileInput.getContent() : "");
                existing.setVersion(newVersion);
                existing.setLastModifiedById(currentUser.getId());
                existing.setLastModifiedByName(currentUser.getName() != null ? currentUser.getName() : currentUser.getUsername());
                existing.setLastCommitMessage(commitMsg);
                existing.setUpdatedAt(LocalDateTime.now());

                AutomationFileEntity saved = fileRepository.save(existing);

                // Record version snapshot
                AutomationFileVersionEntity versionSnapshot = AutomationFileVersionEntity.builder()
                        .fileId(saved.getId())
                        .automationProjectId(projectId)
                        .version(newVersion)
                        .content(saved.getContent())
                        .modifiedById(currentUser.getId())
                        .modifiedByName(saved.getLastModifiedByName())
                        .changeSummary(commitMsg)
                        .createdAt(LocalDateTime.now())
                        .build();
                versionRepository.save(versionSnapshot);

                savedFiles.add(saved);
            } else {
                AutomationFileEntity newFile = AutomationFileEntity.builder()
                        .automationProjectId(projectId)
                        .fileName(derivedFileName)
                        .filePath(normalizedPath)
                        .packagePath(derivedPackage)
                        .language(derivedLanguage)
                        .content(fileInput.getContent() != null ? fileInput.getContent() : "")
                        .version(1)
                        .ownerId(currentUser.getId())
                        .lastModifiedById(currentUser.getId())
                        .lastModifiedByName(currentUser.getName() != null ? currentUser.getName() : currentUser.getUsername())
                        .lastCommitMessage(commitMsg)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build();

                AutomationFileEntity saved = fileRepository.save(newFile);

                // Record initial version snapshot
                AutomationFileVersionEntity versionSnapshot = AutomationFileVersionEntity.builder()
                        .fileId(saved.getId())
                        .automationProjectId(projectId)
                        .version(1)
                        .content(saved.getContent())
                        .modifiedById(currentUser.getId())
                        .modifiedByName(saved.getLastModifiedByName())
                        .changeSummary(commitMsg)
                        .createdAt(LocalDateTime.now())
                        .build();
                versionRepository.save(versionSnapshot);

                savedFiles.add(saved);
            }
        }

        // Recalculate totals on project
        List<AutomationFileEntity> allFiles = fileRepository.findByAutomationProjectIdOrderByFilePathAsc(projectId);
        Set<String> uniquePackages = allFiles.stream()
                .map(AutomationFileEntity::getPackagePath)
                .filter(p -> p != null && !p.isBlank())
                .collect(Collectors.toSet());

        project.setTotalFiles(allFiles.size());
        project.setTotalPackages(uniquePackages.size());
        project.setUpdatedAt(LocalDateTime.now());
        projectRepository.save(project);

        Map<String, Object> result = new HashMap<>();
        result.put("syncedFiles", savedFiles.size());
        result.put("totalFiles", allFiles.size());
        result.put("totalPackages", uniquePackages.size());
        result.put("files", savedFiles);
        if (!conflicts.isEmpty()) {
            result.put("conflicts", conflicts);
            return ResponseEntity.status(HttpStatus.CONFLICT).body(result);
        }

        return ResponseEntity.ok(result);
    }

    @Data
    public static class UpdateFileInput {
        private String content;
        private String commitMessage;
        private Integer expectedVersion;
    }

    @PutMapping("/files/{fileId}")
    @Transactional
    public ResponseEntity<?> updateFile(
            @PathVariable String fileId,
            @RequestBody UpdateFileInput req) {

        UserEntity currentUser = getAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        if (isDeveloperRestricted(currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied: Developer role cannot access AutomationHub. Please use DevelopingHub."));
        }

        Optional<AutomationFileEntity> fileOpt = fileRepository.findById(fileId);
        if (fileOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "File not found"));
        }

        AutomationFileEntity file = fileOpt.get();
        Optional<AutomationProjectEntity> projOpt = projectRepository.findById(file.getAutomationProjectId());
        if (projOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Associated project not found"));
        }

        if (!checkCanEdit(projOpt.get(), currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied: You do not have permission to edit this file"));
        }

        // Optimistic concurrency check
        if (req.getExpectedVersion() != null && file.getVersion() > req.getExpectedVersion()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "error", "Conflict detected: File version on server is newer (" + file.getVersion() + ") than expected (" + req.getExpectedVersion() + ").",
                    "serverVersion", file.getVersion(),
                    "file", file
            ));
        }

        int newVersion = file.getVersion() + 1;
        String commitMsg = req.getCommitMessage() != null && !req.getCommitMessage().isBlank()
                ? req.getCommitMessage()
                : "Source code update";

        file.setContent(req.getContent() != null ? req.getContent() : "");
        file.setVersion(newVersion);
        file.setLastModifiedById(currentUser.getId());
        file.setLastModifiedByName(currentUser.getName() != null ? currentUser.getName() : currentUser.getUsername());
        file.setLastCommitMessage(commitMsg);
        file.setUpdatedAt(LocalDateTime.now());

        AutomationFileEntity updated = fileRepository.save(file);

        // Record version snapshot
        AutomationFileVersionEntity versionSnapshot = AutomationFileVersionEntity.builder()
                .fileId(updated.getId())
                .automationProjectId(file.getAutomationProjectId())
                .version(newVersion)
                .content(updated.getContent())
                .modifiedById(currentUser.getId())
                .modifiedByName(updated.getLastModifiedByName())
                .changeSummary(commitMsg)
                .createdAt(LocalDateTime.now())
                .build();
        versionRepository.save(versionSnapshot);

        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/files/{fileId}")
    @Transactional
    public ResponseEntity<?> deleteFile(@PathVariable String fileId) {
        UserEntity currentUser = getAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        if (isDeveloperRestricted(currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied: Developer role cannot access AutomationHub. Please use DevelopingHub."));
        }

        Optional<AutomationFileEntity> fileOpt = fileRepository.findById(fileId);
        if (fileOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "File not found"));
        }

        AutomationFileEntity file = fileOpt.get();
        Optional<AutomationProjectEntity> projOpt = projectRepository.findById(file.getAutomationProjectId());
        if (projOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Associated project not found"));
        }

        AutomationProjectEntity project = projOpt.get();
        if (!checkCanEdit(project, currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied: You do not have permission to delete this file"));
        }

        versionRepository.deleteByFileId(fileId);
        fileRepository.delete(file);

        // Update project stats
        List<AutomationFileEntity> remainingFiles = fileRepository.findByAutomationProjectIdOrderByFilePathAsc(project.getId());
        Set<String> uniquePackages = remainingFiles.stream()
                .map(AutomationFileEntity::getPackagePath)
                .filter(p -> p != null && !p.isBlank())
                .collect(Collectors.toSet());

        project.setTotalFiles(remainingFiles.size());
        project.setTotalPackages(uniquePackages.size());
        project.setUpdatedAt(LocalDateTime.now());
        projectRepository.save(project);

        return ResponseEntity.ok(Map.of("message", "File deleted successfully"));
    }

    // ============================================================
    // 3. VERSION HISTORY ENDPOINTS
    // ============================================================

    @GetMapping("/files/{fileId}/versions")
    public ResponseEntity<?> getFileVersions(@PathVariable String fileId) {
        UserEntity currentUser = getAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        if (isDeveloperRestricted(currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied: Developer role cannot access AutomationHub. Please use DevelopingHub."));
        }

        List<AutomationFileVersionEntity> versions = versionRepository.findByFileIdOrderByVersionDesc(fileId);
        return ResponseEntity.ok(versions);
    }

    @PostMapping("/files/{fileId}/revert/{versionNumber}")
    @Transactional
    public ResponseEntity<?> revertToVersion(
            @PathVariable String fileId,
            @PathVariable Integer versionNumber) {

        UserEntity currentUser = getAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        if (isDeveloperRestricted(currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied: Developer role cannot access AutomationHub. Please use DevelopingHub."));
        }

        Optional<AutomationFileEntity> fileOpt = fileRepository.findById(fileId);
        if (fileOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "File not found"));
        }

        AutomationFileEntity file = fileOpt.get();
        Optional<AutomationProjectEntity> projOpt = projectRepository.findById(file.getAutomationProjectId());
        if (projOpt.isEmpty() || !checkCanEdit(projOpt.get(), currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied"));
        }

        List<AutomationFileVersionEntity> versions = versionRepository.findByFileIdOrderByVersionDesc(fileId);
        Optional<AutomationFileVersionEntity> targetVerOpt = versions.stream()
                .filter(v -> v.getVersion().equals(versionNumber))
                .findFirst();

        if (targetVerOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Target version not found"));
        }

        AutomationFileVersionEntity targetVer = targetVerOpt.get();
        int newVersion = file.getVersion() + 1;
        String commitMsg = "Reverted to version " + versionNumber;

        file.setContent(targetVer.getContent());
        file.setVersion(newVersion);
        file.setLastModifiedById(currentUser.getId());
        file.setLastModifiedByName(currentUser.getName() != null ? currentUser.getName() : currentUser.getUsername());
        file.setLastCommitMessage(commitMsg);
        file.setUpdatedAt(LocalDateTime.now());

        AutomationFileEntity updated = fileRepository.save(file);

        // Record reversion as new version
        AutomationFileVersionEntity snapshot = AutomationFileVersionEntity.builder()
                .fileId(updated.getId())
                .automationProjectId(file.getAutomationProjectId())
                .version(newVersion)
                .content(updated.getContent())
                .modifiedById(currentUser.getId())
                .modifiedByName(updated.getLastModifiedByName())
                .changeSummary(commitMsg)
                .createdAt(LocalDateTime.now())
                .build();
        versionRepository.save(snapshot);

        return ResponseEntity.ok(updated);
    }

    // ============================================================
    // 4. ACCESS CONTROL & REQUESTS ENDPOINTS
    // ============================================================

    @Data
    public static class AccessRequestBody {
        private String requestedScope; // "PROJECT" or specific path
    }

    @PostMapping("/projects/{projectId}/request-access")
    public ResponseEntity<?> requestEditAccess(
            @PathVariable String projectId,
            @RequestBody(required = false) AccessRequestBody body) {

        UserEntity currentUser = getAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        if (isDeveloperRestricted(currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied: Developer role cannot access AutomationHub. Please use DevelopingHub."));
        }

        Optional<AutomationProjectEntity> projOpt = projectRepository.findById(projectId);
        if (projOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Automation project not found"));
        }

        AutomationProjectEntity project = projOpt.get();
        if (currentUser.getId().equals(project.getOwnerId())) {
            return ResponseEntity.badRequest().body(Map.of("error", "You are the owner and already have edit access"));
        }

        String scope = (body != null && body.getRequestedScope() != null && !body.getRequestedScope().isBlank())
                ? body.getRequestedScope()
                : "PROJECT";

        Optional<AutomationAccessRequestEntity> existingReq =
                accessRequestRepository.findByAutomationProjectIdAndUserId(projectId, currentUser.getId());

        if (existingReq.isPresent()) {
            AutomationAccessRequestEntity req = existingReq.get();
            if ("PENDING".equalsIgnoreCase(req.getStatus()) || "APPROVED".equalsIgnoreCase(req.getStatus())) {
                return ResponseEntity.ok(req);
            }
            // If REJECTED, permit re-requesting
            req.setStatus("PENDING");
            req.setRequestedScope(scope);
            req.setUpdatedAt(LocalDateTime.now());
            AutomationAccessRequestEntity updated = accessRequestRepository.save(req);
            return ResponseEntity.ok(updated);
        }

        AutomationAccessRequestEntity newRequest = AutomationAccessRequestEntity.builder()
                .automationProjectId(project.getId())
                .automationProjectName(project.getName())
                .userId(currentUser.getId())
                .userName(currentUser.getName() != null ? currentUser.getName() : currentUser.getUsername())
                .userRole(currentUser.getRole() != null ? currentUser.getRole().name() : "DEVELOPER")
                .ownerId(project.getOwnerId())
                .requestedScope(scope)
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        AutomationAccessRequestEntity saved = accessRequestRepository.save(newRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/access-requests/owner")
    public ResponseEntity<?> getOwnerAccessRequests() {
        UserEntity currentUser = getAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        if (isDeveloperRestricted(currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied: Developer role cannot access AutomationHub. Please use DevelopingHub."));
        }

        List<AutomationAccessRequestEntity> requests = accessRequestRepository.findByOwnerIdOrderByCreatedAtDesc(currentUser.getId());
        return ResponseEntity.ok(requests);
    }

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
        if (isDeveloperRestricted(currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied: Developer role cannot access AutomationHub. Please use DevelopingHub."));
        }

        Optional<AutomationAccessRequestEntity> reqOpt = accessRequestRepository.findById(requestId);
        if (reqOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Access request not found"));
        }

        AutomationAccessRequestEntity request = reqOpt.get();
        boolean isOwner = currentUser.getId().equals(request.getOwnerId());
        boolean isAdmin = currentUser.getRole() == UserRole.ADMIN;

        if (!isOwner && !isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied: Only the project owner can approve or reject access requests"));
        }

        String newStatus = body.getStatus() != null ? body.getStatus().toUpperCase().trim() : "";
        if (!"APPROVED".equals(newStatus) && !"REJECTED".equals(newStatus)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid status. Must be APPROVED or REJECTED"));
        }

        request.setStatus(newStatus);
        request.setUpdatedAt(LocalDateTime.now());
        AutomationAccessRequestEntity updated = accessRequestRepository.save(request);

        return ResponseEntity.ok(updated);
    }

    // ============================================================
    // 5. IDE INTEGRATION CONNECTION METADATA ENDPOINT
    // ============================================================

    @GetMapping("/ide/status")
    public ResponseEntity<?> getIdeConnectionStatus() {
        UserEntity currentUser = getAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        if (isDeveloperRestricted(currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied: Developer role cannot access AutomationHub. Please use DevelopingHub."));
        }

        Map<String, Object> ideConfig = new HashMap<>();
        ideConfig.put("serverUrl", "http://localhost:8080/api/automation");
        ideConfig.put("userEmail", currentUser.getEmail());
        ideConfig.put("userName", currentUser.getName() != null ? currentUser.getName() : currentUser.getUsername());

        List<Map<String, Object>> ideClients = List.of(
                Map.of(
                        "id", "vscode",
                        "name", "Visual Studio Code",
                        "status", "Ready for Extension",
                        "version", "1.0.0",
                        "pluginCommand", "testverse.automation.connect",
                        "docs", "Use TestVerse VS Code extension to upload/sync test scripts."
                ),
                Map.of(
                        "id", "intellij",
                        "name", "IntelliJ IDEA",
                        "status", "Ready for Plugin",
                        "version", "1.0.0",
                        "pluginCommand", "Tools -> TestVerse -> Sync Automation Project",
                        "docs", "Use TestVerse IntelliJ plugin to synchronize test packages directly."
                ),
                Map.of(
                        "id", "eclipse",
                        "name", "Eclipse IDE",
                        "status", "Ready for Plugin",
                        "version", "1.0.0",
                        "pluginCommand", "TestVerse -> Export to AutomationHub",
                        "docs", "Connect Eclipse Java projects with TestVerse AutomationHub."
                ),
                Map.of(
                        "id", "antigravity",
                        "name", "Antigravity",
                        "status", "Integrated Client",
                        "version", "2.0.0",
                        "pluginCommand", "agy testverse sync --project <id>",
                        "docs", "Direct agentic integration with Antigravity IDE & CLI."
                )
        );

        ideConfig.put("supportedIdes", ideClients);
        return ResponseEntity.ok(ideConfig);
    }

    // Helper: Detect language by file extension
    private String detectLanguage(String fileName) {
        if (fileName == null) return "text";
        String lower = fileName.toLowerCase();
        if (lower.endsWith(".java")) return "java";
        if (lower.endsWith(".ts")) return "typescript";
        if (lower.endsWith(".tsx")) return "typescript";
        if (lower.endsWith(".js")) return "javascript";
        if (lower.endsWith(".jsx")) return "javascript";
        if (lower.endsWith(".py")) return "python";
        if (lower.endsWith(".json")) return "json";
        if (lower.endsWith(".xml")) return "xml";
        if (lower.endsWith(".properties")) return "properties";
        if (lower.endsWith(".feature")) return "gherkin";
        if (lower.endsWith(".yaml") || lower.endsWith(".yml")) return "yaml";
        if (lower.endsWith(".sql")) return "sql";
        if (lower.endsWith(".sh")) return "bash";
        if (lower.endsWith(".html")) return "html";
        if (lower.endsWith(".css")) return "css";
        return "text";
    }
}
