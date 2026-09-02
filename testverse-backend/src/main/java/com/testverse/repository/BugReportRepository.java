package com.testverse.repository;

import com.testverse.model.BugReportEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BugReportRepository extends JpaRepository<BugReportEntity, Long> {
    List<BugReportEntity> findByReporterId(Long reporterId);
    List<BugReportEntity> findByAssigneeId(Long assigneeId);
    List<BugReportEntity> findByProjectId(Long projectId);
    List<BugReportEntity> findByStatus(String status);
}