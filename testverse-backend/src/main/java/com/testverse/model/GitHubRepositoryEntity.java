package com.testverse.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "github_repositories")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GitHubRepositoryEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private String id;

    @Column(name = "testverse_project_id")
    private String testverseProjectId;

    @Column(name = "testverse_project_name")
    private String testverseProjectName;

    @Column(name = "repo_name", nullable = false)
    private String repoName;

    @Column(name = "owner_login", nullable = false)
    private String ownerLogin;

    @Column(name = "full_name", nullable = false)
    private String fullName; // e.g. "SIDHARTHKV2004/TestVerse"

    @Column(name = "github_url", nullable = false)
    private String githubUrl; // e.g. "https://github.com/SIDHARTHKV2004/TestVerse"

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "default_branch")
    private String defaultBranch; // e.g. "main"

    @Column(name = "visibility")
    private String visibility; // "public" or "private"

    @Column(name = "language")
    private String language; // e.g. "Java", "TypeScript", "Python"

    @Column(name = "stars_count")
    private Integer starsCount;

    @Column(name = "forks_count")
    private Integer forksCount;

    @Column(name = "open_issues_count")
    private Integer openIssuesCount;

    @Column(name = "connected_by_id", nullable = false)
    private Long connectedById;

    @Column(name = "connected_by_name", nullable = false)
    private String connectedByName;

    @Column(name = "connected_by_email")
    private String connectedByEmail;

    @Column(name = "connected_at")
    private LocalDateTime connectedAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void init() {
        if (id == null || id.isBlank()) {
            id = UUID.randomUUID().toString();
        }
        if (defaultBranch == null || defaultBranch.isBlank()) {
            defaultBranch = "main";
        }
        if (visibility == null || visibility.isBlank()) {
            visibility = "public";
        }
        if (starsCount == null) {
            starsCount = 0;
        }
        if (forksCount == null) {
            forksCount = 0;
        }
        if (openIssuesCount == null) {
            openIssuesCount = 0;
        }
        if (connectedAt == null) {
            connectedAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
    }
}
