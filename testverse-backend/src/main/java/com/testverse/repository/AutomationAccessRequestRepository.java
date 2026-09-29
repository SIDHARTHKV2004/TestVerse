package com.testverse.repository;

import com.testverse.model.AutomationAccessRequestEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AutomationAccessRequestRepository extends JpaRepository<AutomationAccessRequestEntity, String> {
    List<AutomationAccessRequestEntity> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);
    List<AutomationAccessRequestEntity> findByAutomationProjectId(String automationProjectId);
    Optional<AutomationAccessRequestEntity> findByAutomationProjectIdAndUserId(String automationProjectId, Long userId);
    List<AutomationAccessRequestEntity> findByAutomationProjectIdAndStatus(String automationProjectId, String status);
    List<AutomationAccessRequestEntity> findByUserId(Long userId);
    void deleteByAutomationProjectId(String automationProjectId);
}
