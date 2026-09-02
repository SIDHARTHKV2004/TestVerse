package com.testverse.controller;

import com.testverse.model.TeamEntity;
import com.testverse.model.UserEntity;
import com.testverse.model.UserRole;
import com.testverse.repository.TeamRepository;
import com.testverse.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/team-management")

public class TeamManagementController {

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public Map<String, String> test() {
        System.out.println("✅✅✅ TeamManagementController IS WORKING! ✅✅✅");
        Map<String, String> response = new HashMap<>();
        response.put("status", "TeamManagementController is working!");
        return response;
    }

    @PostMapping("/create")
    public Map<String, Object> createTeam(@RequestBody Map<String, Object> request) {
        System.out.println("📝 CREATE TEAM CALLED!");

        String name = (String) request.get("name");
        String description = (String) request.getOrDefault("description", "");

        // Get admin user (hardcoded for testing)
        UserEntity admin = userRepository.findById(1L).orElse(null);

        TeamEntity team = new TeamEntity();
        team.setName(name);
        team.setDescription(description);
        team.setAdmin(admin);
        team.setCreatedAt(LocalDateTime.now());
        team.setUpdatedAt(LocalDateTime.now());

        List<UserEntity> members = new ArrayList<>();
        members.add(admin);
        team.setMembers(members);

        TeamEntity savedTeam = teamRepository.save(team);

        Map<String, Object> response = new HashMap<>();
        response.put("id", savedTeam.getId());
        response.put("name", savedTeam.getName());
        response.put("description", savedTeam.getDescription());
        response.put("message", "Team created successfully");

        return response;
    }
}
