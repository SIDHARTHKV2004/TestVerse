package com.testverse.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "projects")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String category;

    @Column(columnDefinition = "TEXT")
    private String techStack;

    private Integer progress;

    @ManyToOne
    @JoinColumn(name = "created_by")
    private UserEntity createdBy;

    private String status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}