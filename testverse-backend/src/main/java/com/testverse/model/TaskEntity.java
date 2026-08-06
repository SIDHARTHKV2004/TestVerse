package com.testverse.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tasks")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

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

    @Column(name = "project_id")
    private Long projectId;

    @Column(name = "module_name")
    private String moduleName;

    private String instructions;

    @Column(name = "submission_notes")
    private String submissionNotes;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}