package com.testverse.repository;

import com.testverse.model.TaskEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<TaskEntity, String> {

    List<TaskEntity> findByAssignedStudentId(String studentId);

    List<TaskEntity> findByMentorId(String mentorId);

    List<TaskEntity> findByProjectId(String projectId);

    List<TaskEntity> findByStatus(String status);
}