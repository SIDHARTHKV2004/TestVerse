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
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects")
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
    public ResponseEntity<?> createProject(
            @RequestBody Map<String, Object> request,
            Authentication auth) {

        try {
            UserEntity user = null;
            if (auth != null) {
                user = userRepository.findByUsername(auth.getName())
                        .or(() -> userRepository.findByEmail(auth.getName()))
                        .orElse(null);
            }

            if (user == null) {
                return ResponseEntity.status(401).build();
            }

            ProjectEntity project = new ProjectEntity();

            project.setName((String) request.get("name"));
            project.setDescription((String) request.get("description"));
            project.setCategory(request.get("category") != null ? (String) request.get("category") : "General");
            project.setTechStack(extractTechStack(request.get("techStack")));

            int progress = 0;
            if (request.get("progress") instanceof Number num) {
                progress = num.intValue();
            } else if (request.get("progress") instanceof String progressStr && !progressStr.isBlank()) {
                try {
                    progress = Integer.parseInt(progressStr.trim());
                } catch (NumberFormatException ignored) {}
            }
            project.setProgress(progress);

            project.setCreatedBy(user);

            String status = request.get("status") != null && !request.get("status").toString().isBlank()
                    ? request.get("status").toString().trim()
                    : "Active";
            project.setStatus(status);

            project.setCreatedAt(LocalDateTime.now());
            project.setUpdatedAt(LocalDateTime.now());

            return ResponseEntity.ok(
                    projectRepository.save(project)
            );

        } catch (Exception e) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Unknown error"));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProject(
            @PathVariable String id,
            @RequestBody Map<String, Object> request,
            Authentication auth) {

        try {
            ProjectEntity project = projectRepository.findById(id).orElse(null);
            if (project == null) {
                return ResponseEntity.notFound().build();
            }

            if (request.containsKey("name")) {
                project.setName((String) request.get("name"));
            }
            if (request.containsKey("description")) {
                project.setDescription((String) request.get("description"));
            }
            if (request.containsKey("category")) {
                project.setCategory((String) request.get("category"));
            }
            if (request.containsKey("techStack")) {
                project.setTechStack(extractTechStack(request.get("techStack")));
            }
            if (request.containsKey("status") && request.get("status") != null) {
                project.setStatus(request.get("status").toString().trim());
            }
            if (request.containsKey("progress")) {
                if (request.get("progress") instanceof Number num) {
                    project.setProgress(num.intValue());
                } else if (request.get("progress") instanceof String progressStr && !progressStr.isBlank()) {
                    try {
                        project.setProgress(Integer.parseInt(progressStr.trim()));
                    } catch (NumberFormatException ignored) {}
                }
            }
            project.setUpdatedAt(LocalDateTime.now());

            return ResponseEntity.ok(projectRepository.save(project));

        } catch (Exception e) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Unknown error"));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProject(
            @PathVariable String id) {

        projectRepository.deleteById(id);

        return ResponseEntity.ok(
                Map.of("message", "Project deleted successfully")
        );
    }

    private List<String> extractTechStack(Object techStackObj) {
        List<String> list = new ArrayList<>();
        if (techStackObj instanceof List<?> rawList) {
            for (Object item : rawList) {
                if (item != null && !item.toString().trim().isEmpty()) {
                    list.add(item.toString().trim());
                }
            }
        } else if (techStackObj instanceof String str && !str.trim().isEmpty()) {
            for (String part : str.split(",")) {
                if (!part.trim().isEmpty()) {
                    list.add(part.trim());
                }
            }
        }
        return list;
    }
}