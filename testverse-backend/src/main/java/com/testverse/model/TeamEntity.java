package com.testverse.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "teams")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;

    // Original admin/owner field — preserved for backward compatibility
    @ManyToOne
    @JoinColumn(name = "admin_id")
    private UserEntity admin;

    // Mentor who created this team (null for admin-created legacy teams)
    @ManyToOne
    @JoinColumn(name = "mentor_id")
    private UserEntity createdByMentor;

    // Team composition type
    @Enumerated(EnumType.STRING)
    @Column(name = "team_type")
    @Builder.Default
    private TeamType teamType = TeamType.MIXED;

    // Legacy members list kept for backward compatibility with existing data
    @Builder.Default
    @OneToMany(mappedBy = "team", fetch = FetchType.LAZY)
    private List<UserEntity> members = new ArrayList<>();

    // New normalized memberships
    @Builder.Default
    @OneToMany(mappedBy = "team", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TeamMembershipEntity> memberships = new ArrayList<>();

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}