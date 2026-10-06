package com.testverse.controller;

import com.testverse.model.InvitationEntity;
import com.testverse.model.InvitationStatus;
import com.testverse.model.TeamEntity;
import com.testverse.model.UserEntity;
import com.testverse.model.UserRole;
import com.testverse.repository.InvitationRepository;
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
@RequestMapping("/api/invitations")

public class InvitationController {

    @Autowired
    private InvitationRepository invitationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TeamRepository teamRepository;

    // ===== SEND INVITATION (Admin only) =====
    @PostMapping
    public ResponseEntity<?> sendInvitation(@RequestBody Map<String, Object> request) {
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
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Only Admin can send invitations"));
            }

            String email = (String) request.get("email");
            Long teamId = request.get("teamId") != null ? ((Number) request.get("teamId")).longValue() : null;

            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Email is required"));
            }

            // Check if user already exists
            Optional<UserEntity> existingUser = userRepository.findByEmail(email);
            if (existingUser.isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "User already exists in the system"));
            }

            // Check if invitation already sent
            Optional<InvitationEntity> existingInvitation = invitationRepository.findByEmailAndTeamId(email, teamId);
            if (existingInvitation.isPresent() && existingInvitation.get().getStatus() == InvitationStatus.PENDING) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Invitation already sent to this email"));
            }

            TeamEntity team = null;
            if (teamId != null) {
                team = teamRepository.findById(teamId).orElse(null);
                if (team == null) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Team not found"));
                }
            }

            InvitationEntity invitation = new InvitationEntity();
            invitation.setEmail(email);
            invitation.setTeam(team);
            invitation.setInvitedBy(admin);
            invitation.setStatus(InvitationStatus.PENDING);
            invitation.setCreatedAt(LocalDateTime.now());
            invitation.setUpdatedAt(LocalDateTime.now());

            InvitationEntity savedInvitation = invitationRepository.save(invitation);

            Map<String, Object> response = new HashMap<>();
            response.put("id", savedInvitation.getId());
            response.put("email", savedInvitation.getEmail());
            response.put("teamId", savedInvitation.getTeam() != null ? savedInvitation.getTeam().getId() : null);
            response.put("teamName", savedInvitation.getTeam() != null ? savedInvitation.getTeam().getName() : null);
            response.put("status", savedInvitation.getStatus());
            response.put("invitedBy", savedInvitation.getInvitedBy().getName());
            response.put("createdAt", savedInvitation.getCreatedAt());
            response.put("message", "Invitation sent successfully");

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to send invitation: " + e.getMessage()));
        }
    }

    // ===== GET ALL INVITATIONS (Admin only) =====
    @GetMapping
    public ResponseEntity<?> getAllInvitations() {
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
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Only Admin can view invitations"));
            }

            List<InvitationEntity> invitations = invitationRepository.findAll();

            List<Map<String, Object>> response = new ArrayList<>();
            for (InvitationEntity invitation : invitations) {
                Map<String, Object> invData = new HashMap<>();
                invData.put("id", invitation.getId());
                invData.put("email", invitation.getEmail());
                invData.put("teamId", invitation.getTeam() != null ? invitation.getTeam().getId() : null);
                invData.put("teamName", invitation.getTeam() != null ? invitation.getTeam().getName() : null);
                invData.put("status", invitation.getStatus());
                invData.put("invitedBy", invitation.getInvitedBy().getName());
                invData.put("createdAt", invitation.getCreatedAt());
                response.add(invData);
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch invitations: " + e.getMessage()));
        }
    }

    // ===== GET MY INVITATIONS (For current user) =====
    @GetMapping("/my-invitations")
    public ResponseEntity<?> getMyInvitations() {
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

            List<InvitationEntity> invitations = invitationRepository.findByEmailAndStatus(user.getEmail(), InvitationStatus.PENDING);

            List<Map<String, Object>> response = new ArrayList<>();
            for (InvitationEntity invitation : invitations) {
                Map<String, Object> invData = new HashMap<>();
                invData.put("id", invitation.getId());
                invData.put("email", invitation.getEmail());
                invData.put("teamId", invitation.getTeam() != null ? invitation.getTeam().getId() : null);
                invData.put("teamName", invitation.getTeam() != null ? invitation.getTeam().getName() : null);
                invData.put("status", invitation.getStatus());
                invData.put("invitedBy", invitation.getInvitedBy().getName());
                invData.put("createdAt", invitation.getCreatedAt());
                response.add(invData);
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch your invitations: " + e.getMessage()));
        }
    }

    // ===== ACCEPT INVITATION =====
    @PostMapping("/{id}/accept")
    public ResponseEntity<?> acceptInvitation(@PathVariable Long id) {
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

            InvitationEntity invitation = invitationRepository.findById(id).orElse(null);
            if (invitation == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Invitation not found"));
            }

            // Check if invitation is for this user
            if (!invitation.getEmail().equals(user.getEmail())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "This invitation is not for you"));
            }

            if (invitation.getStatus() != InvitationStatus.PENDING) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "This invitation has already been " + invitation.getStatus()));
            }

            // Add user to team
            if (invitation.getTeam() != null) {
                TeamEntity team = invitation.getTeam();
                if (team.getMembers() == null) {
                    team.setMembers(new ArrayList<>());
                }
                team.getMembers().add(user);
                user.setTeam(team);
                teamRepository.save(team);
                userRepository.save(user);
            }

            // Update invitation status
            invitation.setStatus(InvitationStatus.ACCEPTED);
            invitation.setUpdatedAt(LocalDateTime.now());
            invitationRepository.save(invitation);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Invitation accepted successfully");
            response.put("teamId", invitation.getTeam() != null ? invitation.getTeam().getId() : null);
            response.put("teamName", invitation.getTeam() != null ? invitation.getTeam().getName() : null);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to accept invitation: " + e.getMessage()));
        }
    }

    // ===== DECLINE INVITATION =====
    @PostMapping("/{id}/decline")
    public ResponseEntity<?> declineInvitation(@PathVariable Long id) {
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

            InvitationEntity invitation = invitationRepository.findById(id).orElse(null);
            if (invitation == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Invitation not found"));
            }

            if (!invitation.getEmail().equals(user.getEmail())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "This invitation is not for you"));
            }

            if (invitation.getStatus() != InvitationStatus.PENDING) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "This invitation has already been " + invitation.getStatus()));
            }

            invitation.setStatus(InvitationStatus.DECLINED);
            invitation.setUpdatedAt(LocalDateTime.now());
            invitationRepository.save(invitation);

            return ResponseEntity.ok(Map.of("message", "Invitation declined successfully"));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to decline invitation: " + e.getMessage()));
        }
    }

    // ===== DELETE INVITATION (Admin only) =====
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteInvitation(@PathVariable Long id) {
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
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Only Admin can delete invitations"));
            }

            InvitationEntity invitation = invitationRepository.findById(id).orElse(null);
            if (invitation == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Invitation not found"));
            }

            invitationRepository.deleteById(id);

            return ResponseEntity.ok(Map.of("message", "Invitation deleted successfully"));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete invitation: " + e.getMessage()));
        }
    }
}
