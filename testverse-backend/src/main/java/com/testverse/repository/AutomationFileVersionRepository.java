package com.testverse.repository;

import com.testverse.model.AutomationFileVersionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AutomationFileVersionRepository extends JpaRepository<AutomationFileVersionEntity, String> {
    List<AutomationFileVersionEntity> findByFileIdOrderByVersionDesc(String fileId);
    List<AutomationFileVersionEntity> findByAutomationProjectIdOrderByCreatedAtDesc(String automationProjectId);
    void deleteByFileId(String fileId);
    void deleteByAutomationProjectId(String automationProjectId);
}
