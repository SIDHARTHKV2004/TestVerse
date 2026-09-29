package com.testverse.repository;

import com.testverse.model.SharedDevelopmentResourceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SharedDevelopmentResourceRepository extends JpaRepository<SharedDevelopmentResourceEntity, String> {
    List<SharedDevelopmentResourceEntity> findAllByOrderByCreatedAtDesc();
    List<SharedDevelopmentResourceEntity> findByTestverseProjectIdOrderByCreatedAtDesc(String testverseProjectId);
    List<SharedDevelopmentResourceEntity> findByResourceTypeOrderByCreatedAtDesc(String resourceType);
    List<SharedDevelopmentResourceEntity> findByTestverseProjectIdAndResourceTypeOrderByCreatedAtDesc(String testverseProjectId, String resourceType);
    void deleteByTestverseProjectId(String testverseProjectId);
}
