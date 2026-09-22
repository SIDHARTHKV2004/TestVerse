package com.testverse.repository;

import com.testverse.model.ProjectEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<ProjectEntity, String> {

    List<ProjectEntity> findByCreatedById(String createdById);

    List<ProjectEntity> findByStatus(String status);
}