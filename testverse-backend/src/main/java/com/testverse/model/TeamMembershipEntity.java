package com.testverse.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Represents a user's membership in a team.
 * Unique constraint prevents duplicate memberships.
 * The max-3-teams rule is enforced at service/controller level.
 */
@Entity
@Table(
    name = "team_memberships",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_team_membership_team_user",
            columnNames = {"team_id", "user_id"}
        )
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamMembershipEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    private TeamEntity team;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(name = "joined_at")
    private LocalDateTime joinedAt;

    @PrePersist
    public void onCreate() {
        if (joinedAt == null) {
            joinedAt = LocalDateTime.now();
        }
    }
}
