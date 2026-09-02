package com.testverse.controller;

import com.testverse.model.UserEntity;
import com.testverse.model.UserRole;
import com.testverse.model.UserStatus;
import com.testverse.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;

    // ✅ Get all users (Admin only)
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserEntity currentUser = (UserEntity) auth.getPrincipal();

        if (currentUser.getRole() != UserRole.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only Admin can view all users");
        }

        return ResponseEntity.ok(userRepository.findAll());
    }

    // ✅ Get pending users (Admin only)
    @GetMapping("/users/pending")
    public ResponseEntity<?> getPendingUsers() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserEntity currentUser = (UserEntity) auth.getPrincipal();

        if (currentUser.getRole() != UserRole.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only Admin can view pending users");
        }

        List<UserEntity> pendingUsers = userRepository.findByStatus(UserStatus.PENDING);
        return ResponseEntity.ok(pendingUsers);
    }

    // ✅ Approve user (Admin only)
    @PutMapping("/users/{userId}/approve")
    public ResponseEntity<?> approveUser(@PathVariable Long userId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserEntity currentUser = (UserEntity) auth.getPrincipal();

        if (currentUser.getRole() != UserRole.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only Admin can approve users");
        }

        return userRepository.findById(userId)
                .map(user -> {
                    if (user.getStatus() == UserStatus.PENDING) {
                        user.setStatus(UserStatus.ACTIVE);
                        user.setUpdatedAt(LocalDateTime.now());
                        userRepository.save(user);

                        Map<String, Object> response = new HashMap<>();
                        response.put("message", "User approved successfully");
                        response.put("userId", user.getId());
                        response.put("email", user.getEmail());
                        response.put("name", user.getName());
                        response.put("status", user.getStatus().toString());
                        return ResponseEntity.ok(response);
                    } else {
                        return ResponseEntity.badRequest()
                                .body("User is not in PENDING status");
                    }
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ✅ Reject user (Admin only)
    @PutMapping("/users/{userId}/reject")
    public ResponseEntity<?> rejectUser(@PathVariable Long userId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserEntity currentUser = (UserEntity) auth.getPrincipal();

        if (currentUser.getRole() != UserRole.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only Admin can reject users");
        }

        return userRepository.findById(userId)
                .map(user -> {
                    if (user.getStatus() == UserStatus.PENDING) {
                        user.setStatus(UserStatus.REJECTED);
                        user.setUpdatedAt(LocalDateTime.now());
                        userRepository.save(user);

                        Map<String, Object> response = new HashMap<>();
                        response.put("message", "User rejected successfully");
                        response.put("userId", user.getId());
                        response.put("email", user.getEmail());
                        response.put("name", user.getName());
                        response.put("status", user.getStatus().toString());
                        return ResponseEntity.ok(response);
                    } else {
                        return ResponseEntity.badRequest()
                                .body("User is not in PENDING status");
                    }
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ✅ Suspend user (Admin only)
    @PutMapping("/users/{userId}/suspend")
    public ResponseEntity<?> suspendUser(@PathVariable Long userId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserEntity currentUser = (UserEntity) auth.getPrincipal();

        if (currentUser.getRole() != UserRole.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only Admin can suspend users");
        }

        return userRepository.findById(userId)
                .map(user -> {
                    if (user.getStatus() == UserStatus.ACTIVE) {
                        user.setStatus(UserStatus.SUSPENDED);
                        user.setUpdatedAt(LocalDateTime.now());
                        userRepository.save(user);

                        Map<String, Object> response = new HashMap<>();
                        response.put("message", "User suspended successfully");
                        response.put("userId", user.getId());
                        response.put("email", user.getEmail());
                        response.put("name", user.getName());
                        response.put("status", user.getStatus().toString());
                        return ResponseEntity.ok(response);
                    } else {
                        return ResponseEntity.badRequest()
                                .body("User is not in ACTIVE status");
                    }
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ✅ Activate suspended user (Admin only)
    @PutMapping("/users/{userId}/activate")
    public ResponseEntity<?> activateUser(@PathVariable Long userId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserEntity currentUser = (UserEntity) auth.getPrincipal();

        if (currentUser.getRole() != UserRole.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only Admin can activate users");
        }

        return userRepository.findById(userId)
                .map(user -> {
                    if (user.getStatus() == UserStatus.SUSPENDED) {
                        user.setStatus(UserStatus.ACTIVE);
                        user.setUpdatedAt(LocalDateTime.now());
                        userRepository.save(user);

                        Map<String, Object> response = new HashMap<>();
                        response.put("message", "User activated successfully");
                        response.put("userId", user.getId());
                        response.put("email", user.getEmail());
                        response.put("name", user.getName());
                        response.put("status", user.getStatus().toString());
                        return ResponseEntity.ok(response);
                    } else {
                        return ResponseEntity.badRequest()
                                .body("User is not in SUSPENDED status");
                    }
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ✅ Delete user (Admin only)
    @DeleteMapping("/users/{userId}")
    public ResponseEntity<?> deleteUser(@PathVariable Long userId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserEntity currentUser = (UserEntity) auth.getPrincipal();

        if (currentUser.getRole() != UserRole.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only Admin can delete users");
        }

        if (userRepository.existsById(userId)) {
            userRepository.deleteById(userId);
            return ResponseEntity.ok("User deleted successfully");
        }
        return ResponseEntity.notFound().build();
    }
}