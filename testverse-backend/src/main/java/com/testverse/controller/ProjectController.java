package com.testverse.controller;

import com.testverse.model.ProjectEntity;
import com.testverse.model.UserEntity;
import com.testverse.repository.ProjectRepository;
import com.testverse.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = "*")
public class ProjectController {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<ProjectEntity>> getAllProjects() {
        return ResponseEntity.ok(projectRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<?> createProject(@RequestBody Map<String, Object> request, Authentication auth) {
        try {
            UserEntity user = userRepository.findByUsername(auth.getName()).orElse(null);
            if (user == null) return ResponseEntity.status(401).build();

            ProjectEntity project = new ProjectEntity();
            project.setName((String) request.get("name"));
            project.setDescription((String) request.get("description"));
            project.setCategory((String) request.get("category"));
            project.setTechStack((String) request.get("techStack"));
            project.setProgress(0);
            project.setCreatedBy(user);
            project.setStatus("Active");
            project.setCreatedAt(LocalDateTime.now());
            project.setUpdatedAt(LocalDateTime.now());

            return ResponseEntity.ok(projectRepository.save(project));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProject(@PathVariable Long id) {
        projectRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Project deleted successfully"));
    }
}