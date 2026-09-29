package com.testverse.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "automation_projects")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AutomationProjectEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private String id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "framework")
    private String framework; // Playwright, Selenium, Cypress, Appium, RestAssured, Custom

    @Column(name = "language")
    private String language; // Java, TypeScript, Python, JavaScript, C#

    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    @Column(name = "owner_name", nullable = false)
    private String ownerName;

    @Column(name = "owner_email")
    private String ownerEmail;

    @Column(name = "testverse_project_id")
    private String testverseProjectId;

    @Column(name = "testverse_project_name")
    private String testverseProjectName;

    @Column(name = "total_files")
    private Integer totalFiles;

    @Column(name = "total_packages")
    private Integer totalPackages;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void init() {
        if (id == null || id.isBlank()) {
            id = UUID.randomUUID().toString();
        }
        if (totalFiles == null) {
            totalFiles = 0;
        }
        if (totalPackages == null) {
            totalPackages = 0;
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
    }
}
