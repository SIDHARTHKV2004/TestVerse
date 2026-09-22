package com.testverse.repository;

import com.testverse.model.AutomationScriptEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AutomationScriptRepository
        extends JpaRepository<AutomationScriptEntity, String> {

    List<AutomationScriptEntity> findByCreatedById(String userId);

    List<AutomationScriptEntity> findByProjectId(String projectId);

    List<AutomationScriptEntity> findByFramework(String framework);
}