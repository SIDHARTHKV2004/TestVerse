package com.testverse.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(nullable = false)
    private String type; // "TEAM_INVITE", "MESSAGE", "SYSTEM"

    @Column(name = "is_read")
    @Builder.Default
    private Boolean isRead = false;

    @Column(name = "is_accepted")
    @Builder.Default
    private Boolean isAccepted = false;

    @Column(name = "sender_id")
    private Long senderId;

    @Column(name = "team_id")
    private Long teamId;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}