package com.testverse.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "manual_test_suites")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManualTestSuiteEntity {

    @Id
    @Column(name = "id", nullable = false)
    private String id;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "file_type")
    private String fileType; // xlsx, csv, xls

    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    @Column(name = "owner_name", nullable = false)
    private String ownerName;

    @Column(name = "owner_email")
    private String ownerEmail;

    @Column(name = "total_test_cases")
    private Integer totalTestCases;

    @Column(name = "sheets_data", columnDefinition = "TEXT")
    private String sheetsData;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void generateId() {
        if (id == null || id.isBlank()) {
            id = UUID.randomUUID().toString();
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
    }
}
