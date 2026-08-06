package com.testverse.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "community_comments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommunityCommentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @ManyToOne
    @JoinColumn(name = "author_id", nullable = false)
    private UserEntity author;

    @ManyToOne
    @JoinColumn(name = "post_id", nullable = false)
    private CommunityPostEntity post;

    private Long parentId;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}