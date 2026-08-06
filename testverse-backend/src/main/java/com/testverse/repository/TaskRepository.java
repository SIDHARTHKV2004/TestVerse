package com.testverse.repository;

import com.testverse.model.TaskEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<TaskEntity, Long> {
    List<TaskEntity> findByAssignedStudentId(Long studentId);
    List<TaskEntity> findByMentorId(Long mentorId);
    List<TaskEntity> findByProjectId(Long projectId);
    List<TaskEntity> findByStatus(String status);
}