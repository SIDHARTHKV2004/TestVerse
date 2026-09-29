package com.testverse.repository;

import com.testverse.model.AutomationProjectEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AutomationProjectRepository extends JpaRepository<AutomationProjectEntity, String> {
    List<AutomationProjectEntity> findAllByOrderByCreatedAtDesc();
    List<AutomationProjectEntity> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);
    List<AutomationProjectEntity> findByTestverseProjectIdOrderByCreatedAtDesc(String testverseProjectId);
}
