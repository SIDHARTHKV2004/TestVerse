package com.testverse.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    // Person who sent the message
    @ManyToOne
    @JoinColumn(name = "sender_id", nullable = false)
    private UserEntity sender;

    // Person who receives the message
    // NULL when this is a General message
    @ManyToOne
    @JoinColumn(name = "receiver_id")
    private UserEntity receiver;

    // GENERAL or DIRECT
    @Enumerated(EnumType.STRING)
    @Column(name = "message_type")
    private MessageType messageType;

    // Keeping existing team field temporarily
    // so we don't break the existing database structure
    @ManyToOne
    @JoinColumn(name = "team_id")
    private TeamEntity team;

    // Keeping existing broadcast field temporarily
    @Column(name = "is_broadcast")
    @Builder.Default
    private Boolean isBroadcast = false;
    @Column(name = "is_seen")
    @Builder.Default
    private Boolean isSeen = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {

        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();

        if (isBroadcast == null) {
            isBroadcast = false;
        }

        // Default new messages to GENERAL
        if (messageType == null) {
            messageType = MessageType.GENERAL;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}