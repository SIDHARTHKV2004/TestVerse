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

    // Bug ID - Long
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 1000)
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

    // User ID - String because UserEntity.id is String
    @Column(name = "reporter_id")
    private String reporterId;

    @Column(name = "reporter_name")
    private String reporterName;

    // User ID - String because UserEntity.id is String
    @Column(name = "assignee_id")
    private String assigneeId;

    @Column(name = "assignee_name")
    private String assigneeName;

    // Project ID - Long because ProjectEntity.id is Long
    @Column(name = "project_id")
    private String projectId;

    @Column(name = "project_name")
    private String projectName;

    @Column(name = "screenshot_url")
    private String screenshotUrl;

    @Lob
    @Column(name = "image_data")
    private byte[] imageData;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();

        if (status == null) {
            status = "OPEN";
        }

        if (severity == null) {
            severity = "MEDIUM";
        }

        if (priority == null) {
            priority = "MEDIUM";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
