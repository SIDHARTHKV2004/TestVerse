package com.testverse.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "automation_file_versions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AutomationFileVersionEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private String id;

    @Column(name = "file_id", nullable = false)
    private String fileId;

    @Column(name = "automation_project_id", nullable = false)
    private String automationProjectId;

    @Column(name = "version", nullable = false)
    private Integer version;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Column(name = "modified_by_id")
    private Long modifiedById;

    @Column(name = "modified_by_name")
    private String modifiedByName;

    @Column(name = "change_summary")
    private String changeSummary;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void init() {
        if (id == null || id.isBlank()) {
            id = UUID.randomUUID().toString();
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
