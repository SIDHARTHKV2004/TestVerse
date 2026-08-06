package com.testverse.repository;

import com.testverse.model.AutomationScriptEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AutomationScriptRepository extends JpaRepository<AutomationScriptEntity, Long> {
    List<AutomationScriptEntity> findByCreatedById(Long studentId);
    List<AutomationScriptEntity> findByProjectId(Long projectId);
    List<AutomationScriptEntity> findByFramework(String framework);
}