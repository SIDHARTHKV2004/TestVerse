package com.testverse.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "shared_development_resources")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SharedDevelopmentResourceEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private String id;

    @Column(name = "testverse_project_id")
    private String testverseProjectId;

    @Column(name = "testverse_project_name")
    private String testverseProjectName;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "resource_type", nullable = false)
    private String resourceType; // GITHUB_REPO, DOCUMENTATION, API_DOCS, ARCHITECTURE, SETUP_GUIDE, TOOL, TUTORIAL, CODING_STANDARD, ENVIRONMENT_NOTE

    @Column(name = "resource_url")
    private String resourceUrl;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content; // Detailed notes, instructions, architecture details, markdown

    @Column(name = "tags")
    private String tags; // Comma separated tags e.g. "backend, spring, auth"

    @Column(name = "created_by_id", nullable = false)
    private Long createdById;

    @Column(name = "created_by_name", nullable = false)
    private String createdByName;

    @Column(name = "created_by_email")
    private String createdByEmail;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void init() {
        if (id == null || id.isBlank()) {
            id = UUID.randomUUID().toString();
        }
        if (resourceType == null || resourceType.isBlank()) {
            resourceType = "DOCUMENTATION";
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
    }
}
