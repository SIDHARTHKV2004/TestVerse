package com.testverse.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "automation_files")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AutomationFileEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private String id;

    @Column(name = "automation_project_id", nullable = false)
    private String automationProjectId;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "file_path", nullable = false)
    private String filePath; // Relative path e.g. "src/test/java/page/LoginPage.java"

    @Column(name = "package_path")
    private String packagePath; // e.g. "src/test/java/page"

    @Column(name = "language")
    private String language; // java, typescript, python, javascript, json, xml, properties

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Column(name = "version", nullable = false)
    private Integer version;

    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    @Column(name = "last_modified_by_id")
    private Long lastModifiedById;

    @Column(name = "last_modified_by_name")
    private String lastModifiedByName;

    @Column(name = "last_commit_message")
    private String lastCommitMessage;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void init() {
        if (id == null || id.isBlank()) {
            id = UUID.randomUUID().toString();
        }
        if (version == null) {
            version = 1;
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
    }
}
