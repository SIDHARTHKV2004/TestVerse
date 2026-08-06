package com.testverse.controller;

import com.testverse.model.AutomationScriptEntity;
import com.testverse.model.ProjectEntity;
import com.testverse.model.UserEntity;
import com.testverse.repository.AutomationScriptRepository;
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
@RequestMapping("/api/automation")
@CrossOrigin(origins = "*")
public class AutomationController {

    @Autowired
    private AutomationScriptRepository automationScriptRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping
    public ResponseEntity<?> createScript(@RequestBody Map<String, Object> request, Authentication auth) {
        try {
            UserEntity user = userRepository.findByUsername(auth.getName()).orElse(null);
            if (user == null) return ResponseEntity.status(401).build();

            Long projectId = request.get("projectId") != null ? ((Number) request.get("projectId")).longValue() : null;
            ProjectEntity project = projectId != null ? projectRepository.findById(projectId).orElse(null) : null;

            AutomationScriptEntity script = new AutomationScriptEntity();
            script.setName((String) request.get("name"));
            script.setDescription((String) request.get("description"));
            script.setFramework((String) request.get("framework"));
            script.setCode((String) request.get("code"));
            script.setStatus("Draft");
            script.setCreatedBy(user);
            script.setProject(project);
            script.setCreatedAt(LocalDateTime.now());
            script.setUpdatedAt(LocalDateTime.now());

            return ResponseEntity.ok(automationScriptRepository.save(script));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<AutomationScriptEntity>> getAllScripts() {
        return ResponseEntity.ok(automationScriptRepository.findAll());
    }

    @GetMapping("/my-scripts")
    public ResponseEntity<List<AutomationScriptEntity>> getMyScripts(Authentication auth) {
        UserEntity user = userRepository.findByUsername(auth.getName()).orElse(null);
        if (user == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(automationScriptRepository.findByCreatedById(user.getId()));
    }
}