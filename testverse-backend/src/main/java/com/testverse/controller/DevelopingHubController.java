package com.testverse.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/developing")
@RequiredArgsConstructor
public class DevelopingHubController {

    private final GitHubRepositoryRepository gitHubRepositoryRepository;
    private final SharedDevelopmentResourceRepository sharedResourceRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(6))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

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

    // Role Guard: TESTER and TESTING MENTOR are strictly FORBIDDEN from DevelopingHub
    private boolean isTesterRestricted(UserEntity user) {
        if (user == null) return false;
        if (user.getRole() == UserRole.TESTER) return true;
        if (user.getRole() == UserRole.MENTOR && "TESTING".equalsIgnoreCase(user.getDepartment())) return true;
        return false;
    }

    // ============================================================
    // 1. PROJECTS FOR DEVELOPINGHUB
    // ============================================================

    @GetMapping("/projects")
    public ResponseEntity<?> getDevelopingProjects() {
        UserEntity currentUser = getAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        if (isTesterRestricted(currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied: Tester role cannot access DevelopingHub. Please use AutomationHub."));
        }

        List<ProjectEntity> projects = projectRepository.findAll();
        return ResponseEntity.ok(projects);
    }

    @GetMapping("/projects/{projectId}")
    public ResponseEntity<?> getProjectById(@PathVariable String projectId) {
        UserEntity currentUser = getAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        if (isTesterRestricted(currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied: Tester role cannot access DevelopingHub. Please use AutomationHub."));
        }

        Optional<ProjectEntity> projOpt = projectRepository.findById(projectId);
        if (projOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Project not found"));
        }

        return ResponseEntity.ok(projOpt.get());
    }

    // ============================================================
    // 2. GITHUB REPOSITORY CONNECTION & MANAGEMENT
    // ============================================================

    @GetMapping("/repositories")
    public ResponseEntity<?> getAllRepositories() {
        UserEntity currentUser = getAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        if (isTesterRestricted(currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied: Tester role cannot access DevelopingHub"));
        }

        List<GitHubRepositoryEntity> repos = gitHubRepositoryRepository.findAllByOrderByConnectedAtDesc();
        return ResponseEntity.ok(repos);
    }

    @GetMapping("/projects/{projectId}/repositories")
    public ResponseEntity<?> getRepositoriesForProject(@PathVariable String projectId) {
        UserEntity currentUser = getAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        if (isTesterRestricted(currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied: Tester role cannot access DevelopingHub"));
        }

        List<GitHubRepositoryEntity> repos = gitHubRepositoryRepository.findByTestverseProjectIdOrderByConnectedAtDesc(projectId);
        return ResponseEntity.ok(repos);
    }

    @Data
    public static class ConnectRepoRequest {
        private String repoInput; // "owner/repo" or "https://github.com/owner/repo"
        private String description;
    }

    @PostMapping("/projects/{projectId}/repositories")
    public ResponseEntity<?> connectRepository(
            @PathVariable String projectId,
            @RequestBody ConnectRepoRequest req) {

        UserEntity currentUser = getAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        if (isTesterRestricted(currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied: Tester role cannot access DevelopingHub"));
        }

        if (req.getRepoInput() == null || req.getRepoInput().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "GitHub repository URL or 'owner/repo' is required"));
        }

        // Parse owner and repo name from input
        String cleanInput = req.getRepoInput().trim();
        if (cleanInput.endsWith(".git")) {
            cleanInput = cleanInput.substring(0, cleanInput.length() - 4);
        }
        cleanInput = cleanInput.replace("https://github.com/", "")
                .replace("http://github.com/", "")
                .replace("github.com/", "");
        while (cleanInput.startsWith("/")) cleanInput = cleanInput.substring(1);
        while (cleanInput.endsWith("/")) cleanInput = cleanInput.substring(0, cleanInput.length() - 1);

        String[] parts = cleanInput.split("/");
        if (parts.length < 2) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Invalid repository format. Please provide 'owner/repository' or 'https://github.com/owner/repository'"
            ));
        }

        String owner = parts[0].trim();
        String repoName = parts[1].trim();
        String fullName = owner + "/" + repoName;
        String githubUrl = "https://github.com/" + fullName;

        // Fetch project name if project exists
        String projectName = "TestVerse Project";
        Optional<ProjectEntity> projOpt = projectRepository.findById(projectId);
        if (projOpt.isPresent()) {
            projectName = projOpt.get().getName();
        }

        // Check if already connected for this project
        Optional<GitHubRepositoryEntity> existing =
                gitHubRepositoryRepository.findByTestverseProjectIdAndFullName(projectId, fullName);
        if (existing.isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "error", "Repository '" + fullName + "' is already connected to this project",
                    "repository", existing.get()
            ));
        }

        // Query GitHub API for real live metadata
        String desc = req.getDescription();
        String defaultBranch = "main";
        String visibility = "public";
        String language = "Java";
        int stars = 0;
        int forks = 0;
        int openIssues = 0;

        try {
            HttpRequest ghRequest = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.github.com/repos/" + fullName))
                    .header("Accept", "application/vnd.github.v3+json")
                    .header("User-Agent", "TestVerse-DevelopingHub/1.0")
                    .timeout(Duration.ofSeconds(6))
                    .GET()
                    .build();

            HttpResponse<String> ghResponse = httpClient.send(ghRequest, HttpResponse.BodyHandlers.ofString());
            if (ghResponse.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(ghResponse.body());
                if (desc == null || desc.isBlank()) {
                    desc = root.path("description").asText("");
                }
                defaultBranch = root.path("default_branch").asText("main");
                visibility = root.path("private").asBoolean() ? "private" : "public";
                language = root.path("language").asText("General");
                stars = root.path("stargazers_count").asInt(0);
                forks = root.path("forks_count").asInt(0);
                openIssues = root.path("open_issues_count").asInt(0);
            }
        } catch (Exception e) {
            // Graceful fallback if offline or GitHub API rate-limited
            if (desc == null || desc.isBlank()) {
                desc = "Connected repository " + fullName;
            }
        }

        GitHubRepositoryEntity newRepo = GitHubRepositoryEntity.builder()
                .testverseProjectId(projectId)
                .testverseProjectName(projectName)
                .repoName(repoName)
                .ownerLogin(owner)
                .fullName(fullName)
                .githubUrl(githubUrl)
                .description(desc)
                .defaultBranch(defaultBranch)
                .visibility(visibility)
                .language(language)
                .starsCount(stars)
                .forksCount(forks)
                .openIssuesCount(openIssues)
                .connectedById(currentUser.getId())
                .connectedByName(currentUser.getName() != null ? currentUser.getName() : currentUser.getUsername())
                .connectedByEmail(currentUser.getEmail())
                .connectedAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        GitHubRepositoryEntity saved = gitHubRepositoryRepository.save(newRepo);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @DeleteMapping("/repositories/{repositoryId}")
    @Transactional
    public ResponseEntity<?> disconnectRepository(@PathVariable String repositoryId) {
        UserEntity currentUser = getAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        if (isTesterRestricted(currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied: Tester role cannot access DevelopingHub"));
        }

        Optional<GitHubRepositoryEntity> repoOpt = gitHubRepositoryRepository.findById(repositoryId);
        if (repoOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Repository connection not found"));
        }

        gitHubRepositoryRepository.delete(repoOpt.get());
        return ResponseEntity.ok(Map.of("message", "Repository disconnected successfully"));
    }

    // ============================================================
    // 3. LIVE GITHUB DATA RETRIEVAL (BRANCHES, COMMITS, ISSUES, PRS)
    // GitHub remains the source of truth — data is fetched on demand!
    // ============================================================

    @GetMapping("/repositories/{repositoryId}/branches")
    public ResponseEntity<?> getRepositoryBranches(@PathVariable String repositoryId) {
        UserEntity currentUser = getAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        if (isTesterRestricted(currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied: Tester role cannot access DevelopingHub"));
        }

        Optional<GitHubRepositoryEntity> repoOpt = gitHubRepositoryRepository.findById(repositoryId);
        if (repoOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Repository not found"));
        }

        GitHubRepositoryEntity repo = repoOpt.get();
        List<Map<String, Object>> branchesList = new ArrayList<>();

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.github.com/repos/" + repo.getFullName() + "/branches?per_page=30"))
                    .header("Accept", "application/vnd.github.v3+json")
                    .header("User-Agent", "TestVerse-DevelopingHub/1.0")
                    .timeout(Duration.ofSeconds(6))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                JsonNode array = objectMapper.readTree(response.body());
                for (JsonNode b : array) {
                    Map<String, Object> map = new HashMap<>();
                    String bName = b.path("name").asText();
                    map.put("name", bName);
                    map.put("isDefault", bName.equalsIgnoreCase(repo.getDefaultBranch()));
                    map.put("protected", b.path("protected").asBoolean(false));
                    map.put("commitSha", b.path("commit").path("sha").asText(""));
                    map.put("githubUrl", repo.getGithubUrl() + "/tree/" + bName);
                    branchesList.add(map);
                }
            }
        } catch (Exception e) {
            // Fallback: Return default branch if GitHub is unreachable
            branchesList.add(Map.of(
                    "name", repo.getDefaultBranch() != null ? repo.getDefaultBranch() : "main",
                    "isDefault", true,
                    "protected", true,
                    "githubUrl", repo.getGithubUrl() + "/tree/" + (repo.getDefaultBranch() != null ? repo.getDefaultBranch() : "main")
            ));
        }

        if (branchesList.isEmpty()) {
            branchesList.add(Map.of(
                    "name", repo.getDefaultBranch() != null ? repo.getDefaultBranch() : "main",
                    "isDefault", true,
                    "protected", true,
                    "githubUrl", repo.getGithubUrl() + "/tree/" + (repo.getDefaultBranch() != null ? repo.getDefaultBranch() : "main")
            ));
        }

        return ResponseEntity.ok(branchesList);
    }

    @GetMapping("/repositories/{repositoryId}/commits")
    public ResponseEntity<?> getRepositoryCommits(@PathVariable String repositoryId) {
        UserEntity currentUser = getAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        if (isTesterRestricted(currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied: Tester role cannot access DevelopingHub"));
        }

        Optional<GitHubRepositoryEntity> repoOpt = gitHubRepositoryRepository.findById(repositoryId);
        if (repoOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Repository not found"));
        }

        GitHubRepositoryEntity repo = repoOpt.get();
        List<Map<String, Object>> commitsList = new ArrayList<>();

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.github.com/repos/" + repo.getFullName() + "/commits?per_page=20"))
                    .header("Accept", "application/vnd.github.v3+json")
                    .header("User-Agent", "TestVerse-DevelopingHub/1.0")
                    .timeout(Duration.ofSeconds(6))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                JsonNode array = objectMapper.readTree(response.body());
                for (JsonNode c : array) {
                    Map<String, Object> map = new HashMap<>();
                    String sha = c.path("sha").asText("");
                    String shortSha = sha.length() >= 7 ? sha.substring(0, 7) : sha;
                    JsonNode commitObj = c.path("commit");
                    map.put("sha", sha);
                    map.put("shortSha", shortSha);
                    map.put("message", commitObj.path("message").asText(""));
                    map.put("authorName", commitObj.path("author").path("name").asText("Developer"));
                    map.put("date", commitObj.path("author").path("date").asText(""));
                    map.put("htmlUrl", c.path("html_url").asText(repo.getGithubUrl() + "/commit/" + sha));
                    commitsList.add(map);
                }
            }
        } catch (Exception e) {
            // If offline, return informational empty list
        }

        return ResponseEntity.ok(commitsList);
    }

    @GetMapping("/repositories/{repositoryId}/issues")
    public ResponseEntity<?> getRepositoryIssues(@PathVariable String repositoryId) {
        UserEntity currentUser = getAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        if (isTesterRestricted(currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied: Tester role cannot access DevelopingHub"));
        }

        Optional<GitHubRepositoryEntity> repoOpt = gitHubRepositoryRepository.findById(repositoryId);
        if (repoOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Repository not found"));
        }

        GitHubRepositoryEntity repo = repoOpt.get();
        List<Map<String, Object>> issuesList = new ArrayList<>();

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.github.com/repos/" + repo.getFullName() + "/issues?per_page=20&state=all"))
                    .header("Accept", "application/vnd.github.v3+json")
                    .header("User-Agent", "TestVerse-DevelopingHub/1.0")
                    .timeout(Duration.ofSeconds(6))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                JsonNode array = objectMapper.readTree(response.body());
                for (JsonNode issue : array) {
                    // Filter out pull requests which GitHub also returns in /issues
                    if (issue.has("pull_request")) {
                        continue;
                    }
                    Map<String, Object> map = new HashMap<>();
                    map.put("number", issue.path("number").asInt());
                    map.put("title", issue.path("title").asText());
                    map.put("state", issue.path("state").asText("open"));
                    map.put("author", issue.path("user").path("login").asText());
                    map.put("commentsCount", issue.path("comments").asInt(0));
                    map.put("createdAt", issue.path("created_at").asText());
                    map.put("htmlUrl", issue.path("html_url").asText(repo.getGithubUrl() + "/issues/" + issue.path("number").asInt()));
                    issuesList.add(map);
                }
            }
        } catch (Exception e) {
            // Return empty list on failure
        }

        return ResponseEntity.ok(issuesList);
    }

    @GetMapping("/repositories/{repositoryId}/pull-requests")
    public ResponseEntity<?> getRepositoryPullRequests(@PathVariable String repositoryId) {
        UserEntity currentUser = getAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        if (isTesterRestricted(currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied: Tester role cannot access DevelopingHub"));
        }

        Optional<GitHubRepositoryEntity> repoOpt = gitHubRepositoryRepository.findById(repositoryId);
        if (repoOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Repository not found"));
        }

        GitHubRepositoryEntity repo = repoOpt.get();
        List<Map<String, Object>> prsList = new ArrayList<>();

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.github.com/repos/" + repo.getFullName() + "/pulls?per_page=20&state=all"))
                    .header("Accept", "application/vnd.github.v3+json")
                    .header("User-Agent", "TestVerse-DevelopingHub/1.0")
                    .timeout(Duration.ofSeconds(6))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                JsonNode array = objectMapper.readTree(response.body());
                for (JsonNode pr : array) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("number", pr.path("number").asInt());
                    map.put("title", pr.path("title").asText());
                    map.put("state", pr.path("state").asText("open"));
                    map.put("author", pr.path("user").path("login").asText());
                    map.put("headBranch", pr.path("head").path("ref").asText(""));
                    map.put("baseBranch", pr.path("base").path("ref").asText(""));
                    map.put("createdAt", pr.path("created_at").asText());
                    map.put("htmlUrl", pr.path("html_url").asText(repo.getGithubUrl() + "/pull/" + pr.path("number").asInt()));
                    prsList.add(map);
                }
            }
        } catch (Exception e) {
            // Return empty list on failure
        }

        return ResponseEntity.ok(prsList);
    }

    // ============================================================
    // 4. SHARED DEVELOPMENT RESOURCES & NOTES
    // ============================================================

    @GetMapping("/resources")
    public ResponseEntity<?> getSharedResources(
            @RequestParam(required = false) String projectId,
            @RequestParam(required = false) String resourceType) {

        UserEntity currentUser = getAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        if (isTesterRestricted(currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied: Tester role cannot access DevelopingHub"));
        }

        List<SharedDevelopmentResourceEntity> resources;
        if (projectId != null && !projectId.isBlank() && resourceType != null && !resourceType.isBlank()) {
            resources = sharedResourceRepository.findByTestverseProjectIdAndResourceTypeOrderByCreatedAtDesc(projectId, resourceType);
        } else if (projectId != null && !projectId.isBlank()) {
            resources = sharedResourceRepository.findByTestverseProjectIdOrderByCreatedAtDesc(projectId);
        } else if (resourceType != null && !resourceType.isBlank()) {
            resources = sharedResourceRepository.findByResourceTypeOrderByCreatedAtDesc(resourceType);
        } else {
            resources = sharedResourceRepository.findAllByOrderByCreatedAtDesc();
        }

        return ResponseEntity.ok(resources);
    }

    @Data
    public static class CreateResourceRequest {
        private String testverseProjectId;
        private String testverseProjectName;
        private String title;
        private String description;
        private String resourceType; // GITHUB_REPO, DOCUMENTATION, API_DOCS, ARCHITECTURE, SETUP_GUIDE, TOOL, TUTORIAL, CODING_STANDARD, ENVIRONMENT_NOTE
        private String resourceUrl;
        private String content;
        private String tags;
    }

    @PostMapping("/resources")
    public ResponseEntity<?> createSharedResource(@RequestBody CreateResourceRequest req) {
        UserEntity currentUser = getAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        if (isTesterRestricted(currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied: Tester role cannot access DevelopingHub"));
        }

        if (req.getTitle() == null || req.getTitle().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Resource title is required"));
        }

        String projectName = req.getTestverseProjectName();
        if ((projectName == null || projectName.isBlank()) && req.getTestverseProjectId() != null) {
            projectRepository.findById(req.getTestverseProjectId())
                    .ifPresent(p -> {});
        }

        SharedDevelopmentResourceEntity resource = SharedDevelopmentResourceEntity.builder()
                .testverseProjectId(req.getTestverseProjectId())
                .testverseProjectName(projectName != null ? projectName : "General")
                .title(req.getTitle().trim())
                .description(req.getDescription())
                .resourceType(req.getResourceType() != null ? req.getResourceType().toUpperCase() : "DOCUMENTATION")
                .resourceUrl(req.getResourceUrl())
                .content(req.getContent())
                .tags(req.getTags())
                .createdById(currentUser.getId())
                .createdByName(currentUser.getName() != null ? currentUser.getName() : currentUser.getUsername())
                .createdByEmail(currentUser.getEmail())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        SharedDevelopmentResourceEntity saved = sharedResourceRepository.save(resource);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/resources/{resourceId}")
    public ResponseEntity<?> updateSharedResource(
            @PathVariable String resourceId,
            @RequestBody CreateResourceRequest req) {

        UserEntity currentUser = getAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        if (isTesterRestricted(currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied: Tester role cannot access DevelopingHub"));
        }

        Optional<SharedDevelopmentResourceEntity> resOpt = sharedResourceRepository.findById(resourceId);
        if (resOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Resource not found"));
        }

        SharedDevelopmentResourceEntity resource = resOpt.get();
        if (req.getTitle() != null && !req.getTitle().isBlank()) {
            resource.setTitle(req.getTitle().trim());
        }
        if (req.getDescription() != null) {
            resource.setDescription(req.getDescription());
        }
        if (req.getResourceType() != null) {
            resource.setResourceType(req.getResourceType().toUpperCase());
        }
        if (req.getResourceUrl() != null) {
            resource.setResourceUrl(req.getResourceUrl());
        }
        if (req.getContent() != null) {
            resource.setContent(req.getContent());
        }
        if (req.getTags() != null) {
            resource.setTags(req.getTags());
        }
        resource.setUpdatedAt(LocalDateTime.now());

        SharedDevelopmentResourceEntity updated = sharedResourceRepository.save(resource);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/resources/{resourceId}")
    public ResponseEntity<?> deleteSharedResource(@PathVariable String resourceId) {
        UserEntity currentUser = getAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        if (isTesterRestricted(currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied: Tester role cannot access DevelopingHub"));
        }

        Optional<SharedDevelopmentResourceEntity> resOpt = sharedResourceRepository.findById(resourceId);
        if (resOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Resource not found"));
        }

        sharedResourceRepository.delete(resOpt.get());
        return ResponseEntity.ok(Map.of("message", "Resource deleted successfully"));
    }
}
