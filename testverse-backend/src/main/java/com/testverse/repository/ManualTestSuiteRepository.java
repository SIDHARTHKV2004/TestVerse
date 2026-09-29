package com.testverse.repository;

import com.testverse.model.ManualTestSuiteEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ManualTestSuiteRepository extends JpaRepository<ManualTestSuiteEntity, String> {
    List<ManualTestSuiteEntity> findAllByOrderByCreatedAtDesc();
    List<ManualTestSuiteEntity> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);
}
