package com.testverse.repository;

import com.testverse.model.GitHubRepositoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GitHubRepositoryRepository extends JpaRepository<GitHubRepositoryEntity, String> {
    List<GitHubRepositoryEntity> findAllByOrderByConnectedAtDesc();
    List<GitHubRepositoryEntity> findByTestverseProjectIdOrderByConnectedAtDesc(String testverseProjectId);
    Optional<GitHubRepositoryEntity> findByFullName(String fullName);
    Optional<GitHubRepositoryEntity> findByTestverseProjectIdAndFullName(String testverseProjectId, String fullName);
    void deleteByTestverseProjectId(String testverseProjectId);
}
