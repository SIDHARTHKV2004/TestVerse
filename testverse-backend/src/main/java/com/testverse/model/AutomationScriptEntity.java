package com.testverse.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "automation_scripts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AutomationScriptEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String framework;

    @Column(columnDefinition = "TEXT")
    private String code;

    private String status;

    @ManyToOne
    @JoinColumn(name = "created_by")
    private UserEntity createdBy;

    @ManyToOne
    @JoinColumn(name = "project_id")
    private ProjectEntity project;

    @Column(name = "last_run_at")
    private LocalDateTime lastRunAt;

    @Column(name = "last_result")
    private String lastResult;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}