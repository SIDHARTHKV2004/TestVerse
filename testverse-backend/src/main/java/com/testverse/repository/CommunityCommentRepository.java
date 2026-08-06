package com.testverse.repository;

import com.testverse.model.CommunityCommentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommunityCommentRepository extends JpaRepository<CommunityCommentEntity, Long> {
    List<CommunityCommentEntity> findByPostId(Long postId);
    List<CommunityCommentEntity> findByAuthorId(Long authorId);
}