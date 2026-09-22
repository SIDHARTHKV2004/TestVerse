package com.testverse.repository;

import com.testverse.model.BugReportEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BugReportRepository extends JpaRepository<BugReportEntity, String> {

    List<BugReportEntity> findByReporterId(String reporterId);

    List<BugReportEntity> findByAssigneeId(String assigneeId);

    List<BugReportEntity> findByProjectId(String projectId);

    List<BugReportEntity> findByStatus(String status);
}