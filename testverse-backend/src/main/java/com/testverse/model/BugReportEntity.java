package com.testverse.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "bug_reports")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BugReportEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false)
    private String priority;

    @Column(nullable = false)
    private String severity;

    @Column(columnDefinition = "TEXT")
    private String stepsToReproduce;

    @Column(columnDefinition = "TEXT")
    private String expectedResult;

    @Column(columnDefinition = "TEXT")
    private String actualResult;

    private String screenshotUrl;

    private Long reporterId;
    private String reporterName;
    private String assigneeName;
    private String projectName;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}