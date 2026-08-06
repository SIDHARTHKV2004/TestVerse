package com.testverse.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "community_posts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommunityPostEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @ManyToOne
    @JoinColumn(name = "author_id", nullable = false)
    private UserEntity author;

    private String tags;
    private String codeSnippet;
    private String codeLanguage;
    private String linkUrl;
    private String images;
    private Boolean isPinned = false;
    private Integer likesCount = 0;
    private Integer commentsCount = 0;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}