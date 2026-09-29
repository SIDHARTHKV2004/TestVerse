package com.testverse.repository;

import com.testverse.model.ManualTestAccessRequestEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ManualTestAccessRequestRepository extends JpaRepository<ManualTestAccessRequestEntity, String> {
    List<ManualTestAccessRequestEntity> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);
    List<ManualTestAccessRequestEntity> findBySuiteId(String suiteId);
    Optional<ManualTestAccessRequestEntity> findBySuiteIdAndUserId(String suiteId, Long userId);
    List<ManualTestAccessRequestEntity> findBySuiteIdAndStatus(String suiteId, String status);
    List<ManualTestAccessRequestEntity> findByUserId(Long userId);
}
