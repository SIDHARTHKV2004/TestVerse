package com.testverse.repository;

import com.testverse.model.CommunityPostEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommunityPostRepository extends JpaRepository<CommunityPostEntity, Long> {
    List<CommunityPostEntity> findByAuthorId(Long authorId);
    List<CommunityPostEntity> findByIsPinnedTrue();
}