package com.testverse.controller;

import com.testverse.model.UserEntity;
import com.testverse.model.UserRole;
import com.testverse.model.UserStatus;
import com.testverse.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    // ===== GET ALL USERS (Admin only) =====
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(Authentication auth) {
        try {
            UserEntity admin = userRepository.findByUsername(auth.getName()).orElse(null);
            if (admin == null || admin.getRole() != UserRole.ADMIN) {
                return ResponseEntity.status(403).body(Map.of("error", "Only Admin can access this"));
            }

            List<UserEntity> users = userRepository.findAll();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ===== GET PENDING USERS (Admin only) =====
    @GetMapping("/pending-users")
    public ResponseEntity<?> getPendingUsers(Authentication auth) {
        try {
            UserEntity admin = userRepository.findByUsername(auth.getName()).orElse(null);
            if (admin == null || admin.getRole() != UserRole.ADMIN) {
                return ResponseEntity.status(403).body(Map.of("error", "Only Admin can access this"));
            }

            List<UserEntity> pendingUsers = userRepository.findByStatus(UserStatus.PENDING);
            return ResponseEntity.ok(pendingUsers);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ===== APPROVE OR REJECT USER (Admin only) =====
    @PatchMapping("/users/{userId}/status")
    public ResponseEntity<?> updateUserStatus(@PathVariable Long userId,
                                              @RequestBody Map<String, String> request,
                                              Authentication auth) {
        try {
            UserEntity admin = userRepository.findByUsername(auth.getName()).orElse(null);
            if (admin == null || admin.getRole() != UserRole.ADMIN) {
                return ResponseEntity.status(403).body(Map.of("error", "Only Admin can do this"));
            }

            UserEntity user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                return ResponseEntity.notFound().build();
            }

            String statusStr = request.get("status");
            UserStatus newStatus;
            try {
                newStatus = UserStatus.valueOf(statusStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid status"));
            }

            user.setStatus(newStatus);
            userRepository.save(user);

            System.out.println("✅ User " + user.getUsername() + " status updated to: " + newStatus);
            return ResponseEntity.ok(Map.of(
                    "message", "User status updated successfully",
                    "userId", user.getId(),
                    "username", user.getUsername(),
                    "status", newStatus.name()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ===== DELETE USER (Admin only) =====
    @DeleteMapping("/users/{userId}")
    public ResponseEntity<?> deleteUser(@PathVariable Long userId, Authentication auth) {
        try {
            UserEntity admin = userRepository.findByUsername(auth.getName()).orElse(null);
            if (admin == null || admin.getRole() != UserRole.ADMIN) {
                return ResponseEntity.status(403).body(Map.of("error", "Only Admin can delete users"));
            }

            UserEntity user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                return ResponseEntity.notFound().build();
            }

            // Don't allow deleting yourself
            if (user.getId().equals(admin.getId())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Cannot delete yourself"));
            }

            userRepository.deleteById(userId);
            return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}