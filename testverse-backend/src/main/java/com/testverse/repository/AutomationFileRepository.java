package com.testverse.repository;

import com.testverse.model.AutomationFileEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AutomationFileRepository extends JpaRepository<AutomationFileEntity, String> {
    List<AutomationFileEntity> findByAutomationProjectIdOrderByFilePathAsc(String automationProjectId);
    Optional<AutomationFileEntity> findByAutomationProjectIdAndFilePath(String automationProjectId, String filePath);
    long countByAutomationProjectId(String automationProjectId);
    void deleteByAutomationProjectId(String automationProjectId);
}
