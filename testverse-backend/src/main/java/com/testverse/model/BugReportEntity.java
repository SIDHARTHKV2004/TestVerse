package com.testverse.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "bug_reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BugReportEntity {

    @Id
    @Column(nullable = false, updatable = false)
    private String id;

    @Column(nullable = false)
    private String title;

    @Column(length = 1000)
    private String description;

    private String severity;
    private String priority;
    private String status;

    @Column(name = "steps_to_reproduce", length = 2000)
    private String stepsToReproduce;

    @Column(name = "expected_result", length = 1000)
    private String expectedResult;

    @Column(name = "actual_result", length = 1000)
    private String actualResult;

    // User ID - Long because UserEntity.id is Long
    @Column(name = "reporter_id")
    private Long reporterId;

    @Column(name = "reporter_name")
    private String reporterName;

    // User ID - Long because UserEntity.id is Long
    @Column(name = "assignee_id")
    private Long assigneeId;

    @Column(name = "assignee_name")
    private String assigneeName;

    @Column(name = "reporter_mentor_id")
    private Long reporterMentorId;

    @Column(name = "assignee_mentor_id")
    private Long assigneeMentorId;

    // Project ID - String because ProjectEntity.id is String
    @Column(name = "project_id")
    private String projectId;

    @Column(name = "project_name")
    private String projectName;

    @Column(name = "screenshot_url")
    private String screenshotUrl;

    @Column(name = "video_url")
    private String videoUrl;

    @Lob
    @Column(name = "image_data")
    private byte[] imageData;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (id == null || id.isBlank()) {
            id = java.util.UUID.randomUUID().toString();
        }

        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();

        if (status == null || status.isBlank()) {
            status = "OPEN";
        }

        if (severity == null || severity.isBlank()) {
            severity = "MEDIUM";
        }

        if (priority == null || priority.isBlank()) {
            priority = "MEDIUM";
        }

        if (stepsToReproduce == null) {
            stepsToReproduce = "";
        }

        if (expectedResult == null) {
            expectedResult = "";
        }

        if (actualResult == null) {
            actualResult = "";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
