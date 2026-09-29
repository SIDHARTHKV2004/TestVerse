package com.testverse.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tasks")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskEntity {

    @Id
    @Column(name = "id", nullable = false)
    private String id;

    @Column(nullable = false)
    private String title;

    private String description;

    private String status;

    private String priority;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "assigned_student_id")
    private Long assignedStudentId;

    @Column(name = "mentor_id")
    private Long mentorId;

    @Column(name = "created_by_id")
    private Long createdById;

    @Column(name = "created_by_name")
    private String createdByName;

    @Column(name = "project_id")
    private String projectId;

    @Column(name = "module_name")
    private String moduleName;

    private String instructions;

    @Column(name = "submission_notes")
    private String submissionNotes;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "is_new_assignment")
    private Boolean isNewAssignment;

    public Boolean getIsNewAssignment() {
        if (this.isNewAssignment == null) {
            return assignedStudentId != null;
        }
        return this.isNewAssignment;
    }

    public void setIsNewAssignment(Boolean isNewAssignment) {
        this.isNewAssignment = isNewAssignment;
    }

    @PrePersist
    public void generateId() {
        if (id == null || id.isBlank()) {
            id = UUID.randomUUID().toString();
        }
    }
}