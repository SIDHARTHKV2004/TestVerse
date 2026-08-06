package com.testverse.controller;

import com.testverse.model.TeamEntity;
import com.testverse.model.UserEntity;
import com.testverse.model.UserRole;
import com.testverse.repository.TeamRepository;
import com.testverse.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/teams")
@CrossOrigin(origins = "*")
public class TeamController {

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private UserRepository userRepository;

    // ===== GET ALL TEAMS (Admin only) =====
    @GetMapping
    public ResponseEntity<?> getAllTeams() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
            }

            String username = auth.getName();
            UserEntity user = userRepository.findByUsername(username).orElse(null);

            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "User not found"));
            }

            if (user.getRole() != UserRole.ADMIN) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Only Admin can view all teams"));
            }

            List<TeamEntity> teams = teamRepository.findAll();

            List<Map<String, Object>> response = new ArrayList<>();
            for (TeamEntity team : teams) {
                Map<String, Object> teamData = new HashMap<>();
                teamData.put("id", team.getId());
                teamData.put("name", team.getName());
                teamData.put("description", team.getDescription() != null ? team.getDescription() : "");
                teamData.put("createdAt", team.getCreatedAt());

                List<Map<String, Object>> members = new ArrayList<>();
                if (team.getMembers() != null) {
                    for (UserEntity member : team.getMembers()) {
                        Map<String, Object> memberData = new HashMap<>();
                        memberData.put("id", member.getId());
                        memberData.put("username", member.getUsername());
                        memberData.put("email", member.getEmail());
                        memberData.put("name", member.getName());
                        memberData.put("role", member.getRole());
                        members.add(memberData);
                    }
                }
                teamData.put("members", members);
                teamData.put("memberCount", members.size());

                response.add(teamData);
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch teams: " + e.getMessage()));
        }
    }

    // ===== CREATE TEAM (Admin only) =====
    @PostMapping
    public ResponseEntity<?> createTeam(@RequestBody Map<String, Object> request) {
        try {
            System.out.println("📝 CREATE TEAM REQUEST RECEIVED");

            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
            }

            String username = auth.getName();
            UserEntity admin = userRepository.findByUsername(username).orElse(null);

            if (admin == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "User not found"));
            }

            if (admin.getRole() != UserRole.ADMIN) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Only Admin can create teams"));
            }

            String name = (String) request.get("name");
            String description = (String) request.getOrDefault("description", "");

            if (name == null || name.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Team name is required"));
            }

            // Check if team name already exists
            Optional<TeamEntity> existingTeam = teamRepository.findByName(name);
            if (existingTeam.isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Team name already exists"));
            }

            TeamEntity team = new TeamEntity();
            team.setName(name);
            team.setDescription(description);
            team.setAdmin(admin);
            team.setCreatedAt(LocalDateTime.now());
            team.setUpdatedAt(LocalDateTime.now());

            // Add admin as first member
            List<UserEntity> members = new ArrayList<>();
            members.add(admin);
            team.setMembers(members);

            TeamEntity savedTeam = teamRepository.save(team);
            System.out.println("✅ Team created with ID: " + savedTeam.getId());

            Map<String, Object> response = new HashMap<>();
            response.put("id", savedTeam.getId());
            response.put("name", savedTeam.getName());
            response.put("description", savedTeam.getDescription());
            response.put("adminId", savedTeam.getAdmin().getId());
            response.put("adminName", savedTeam.getAdmin().getName());
            response.put("createdAt", savedTeam.getCreatedAt());
            response.put("message", "Team created successfully");

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            System.err.println("❌ Error creating team: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to create team: " + e.getMessage()));
        }
    }

    // ===== GET MY TEAMS =====
    @GetMapping("/my-teams")
    public ResponseEntity<?> getMyTeams() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
            }

            String username = auth.getName();
            UserEntity user = userRepository.findByUsername(username).orElse(null);

            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "User not found"));
            }

            // Find teams where user is a member
            List<TeamEntity> teams = teamRepository.findByMembersId(user.getId());

            List<Map<String, Object>> response = new ArrayList<>();
            for (TeamEntity team : teams) {
                Map<String, Object> teamData = new HashMap<>();
                teamData.put("id", team.getId());
                teamData.put("name", team.getName());
                teamData.put("description", team.getDescription() != null ? team.getDescription() : "");
                teamData.put("memberCount", team.getMembers() != null ? team.getMembers().size() : 0);
                teamData.put("isAdmin", team.getAdmin() != null && team.getAdmin().getId().equals(user.getId()));
                response.add(teamData);
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch your teams: " + e.getMessage()));
        }
    }

    // ===== ADD MEMBER TO TEAM =====
    @PostMapping("/{teamId}/members")
    public ResponseEntity<?> addMember(@PathVariable Long teamId, @RequestBody Map<String, Object> request) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
            }

            String username = auth.getName();
            UserEntity admin = userRepository.findByUsername(username).orElse(null);

            if (admin == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "User not found"));
            }

            if (admin.getRole() != UserRole.ADMIN) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Only Admin can add members"));
            }

            TeamEntity team = teamRepository.findById(teamId).orElse(null);
            if (team == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Team not found"));
            }

            Long userId = ((Number) request.get("userId")).longValue();
            UserEntity user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
            }

            // Initialize members list if null
            if (team.getMembers() == null) {
                team.setMembers(new ArrayList<>());
            }

            // Check if user is already in team
            boolean alreadyInTeam = team.getMembers().stream().anyMatch(m -> m.getId().equals(userId));
            if (alreadyInTeam) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "User is already in this team"));
            }

            // Add user to team
            team.getMembers().add(user);
            user.setTeam(team);

            TeamEntity updatedTeam = teamRepository.save(team);
            userRepository.save(user);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "User added to team successfully");
            response.put("teamId", updatedTeam.getId());
            response.put("teamName", updatedTeam.getName());
            response.put("userId", user.getId());
            response.put("userName", user.getName());
            response.put("userRole", user.getRole());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to add member: " + e.getMessage()));
        }
    }

    // ===== REMOVE MEMBER FROM TEAM =====
    @DeleteMapping("/{teamId}/members/{userId}")
    public ResponseEntity<?> removeMember(@PathVariable Long teamId, @PathVariable Long userId) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
            }

            String username = auth.getName();
            UserEntity admin = userRepository.findByUsername(username).orElse(null);

            if (admin == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "User not found"));
            }

            if (admin.getRole() != UserRole.ADMIN) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Only Admin can remove members"));
            }

            TeamEntity team = teamRepository.findById(teamId).orElse(null);
            if (team == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Team not found"));
            }

            UserEntity user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
            }

            if (team.getMembers() != null) {
                team.getMembers().remove(user);
            }
            user.setTeam(null);

            teamRepository.save(team);
            userRepository.save(user);

            return ResponseEntity.ok(Map.of("message", "User removed from team successfully"));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to remove member: " + e.getMessage()));
        }
    }

    // ===== DELETE TEAM =====
    @DeleteMapping("/{teamId}")
    public ResponseEntity<?> deleteTeam(@PathVariable Long teamId) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
            }

            String username = auth.getName();
            UserEntity admin = userRepository.findByUsername(username).orElse(null);

            if (admin == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "User not found"));
            }

            if (admin.getRole() != UserRole.ADMIN) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Only Admin can delete teams"));
            }

            TeamEntity team = teamRepository.findById(teamId).orElse(null);
            if (team == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Team not found"));
            }

            // Remove team from all members
            if (team.getMembers() != null) {
                for (UserEntity member : team.getMembers()) {
                    member.setTeam(null);
                    userRepository.save(member);
                }
            }

            teamRepository.deleteById(teamId);

            return ResponseEntity.ok(Map.of("message", "Team deleted successfully"));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete team: " + e.getMessage()));
        }
    }
}