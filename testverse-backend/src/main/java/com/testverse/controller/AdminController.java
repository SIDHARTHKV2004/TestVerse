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

    // ============================================================
    // GET ALL USERS
    // ============================================================

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {

        Authentication auth =
                SecurityContextHolder.getContext().getAuthentication();

        System.out.println("======================================");
        System.out.println("ADMIN USERS API CALLED");

        if (auth == null) {
            System.out.println("ADMIN API AUTHENTICATION: NULL");

            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body("Authentication is missing");
        }

        System.out.println(
                "ADMIN API AUTHENTICATION: " +
                        auth.isAuthenticated()
        );

        System.out.println(
                "ADMIN API PRINCIPAL: " +
                        auth.getPrincipal()
        );

        System.out.println(
                "ADMIN API AUTHORITIES: " +
                        auth.getAuthorities()
        );

        Object principal = auth.getPrincipal();

        if (!(principal instanceof UserEntity)) {

            System.out.println(
                    "ADMIN API ERROR: Principal is not UserEntity"
            );

            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body("Invalid authenticated user");
        }

        UserEntity currentUser =
                (UserEntity) principal;

        System.out.println(
                "ADMIN API USER: " +
                        currentUser.getEmail()
        );

        System.out.println(
                "ADMIN API ROLE: " +
                        currentUser.getRole()
        );

        System.out.println(
                "ADMIN API USER AUTHORITIES: " +
                        currentUser.getAuthorities()
        );

        if (currentUser.getRole() != UserRole.ADMIN) {

            System.out.println(
                    "ADMIN API ACCESS DENIED: User is not ADMIN"
            );

            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body("Only Admin can view all users");
        }

        List<UserEntity> users =
                userRepository.findAll();

        System.out.println(
                "ADMIN API USERS FOUND: " +
                        users.size()
        );

        System.out.println("======================================");

        return ResponseEntity.ok(users);
    }

    // ============================================================
    // GET PENDING USERS
    // ============================================================

    @GetMapping("/users/pending")
    public ResponseEntity<?> getPendingUsers() {

        Authentication auth =
                SecurityContextHolder.getContext().getAuthentication();

        if (auth == null ||
                !(auth.getPrincipal() instanceof UserEntity)) {

            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body("Authentication is required");
        }

        UserEntity currentUser =
                (UserEntity) auth.getPrincipal();

        if (currentUser.getRole() != UserRole.ADMIN) {

            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body("Only Admin can view pending users");
        }

        List<UserEntity> pendingUsers =
                userRepository.findByStatus(UserStatus.PENDING);

        return ResponseEntity.ok(pendingUsers);
    }

    // ============================================================
    // APPROVE USER
    // ============================================================

    @PutMapping("/users/{userId}/approve")
    public ResponseEntity<?> approveUser(
            @PathVariable String userId) {

        Authentication auth =
                SecurityContextHolder.getContext().getAuthentication();

        if (auth == null ||
                !(auth.getPrincipal() instanceof UserEntity)) {

            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body("Authentication is required");
        }

        UserEntity currentUser =
                (UserEntity) auth.getPrincipal();

        if (currentUser.getRole() != UserRole.ADMIN) {

            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body("Only Admin can approve users");
        }

        return userRepository.findById(userId)
                .map(user -> {

                    if (user.getStatus() == UserStatus.PENDING) {

                        user.setStatus(UserStatus.ACTIVE);
                        user.setUpdatedAt(LocalDateTime.now());

                        userRepository.save(user);

                        Map<String, Object> response =
                                new HashMap<>();

                        response.put(
                                "message",
                                "User approved successfully"
                        );

                        response.put(
                                "userId",
                                user.getId()
                        );

                        response.put(
                                "email",
                                user.getEmail()
                        );

                        response.put(
                                "name",
                                user.getName()
                        );

                        response.put(
                                "status",
                                user.getStatus().toString()
                        );

                        return ResponseEntity.ok(response);

                    } else {

                        return ResponseEntity
                                .badRequest()
                                .body(
                                        "User is not in PENDING status"
                                );
                    }
                })
                .orElse(
                        ResponseEntity
                                .notFound()
                                .build()
                );
    }

    // ============================================================
    // REJECT USER
    // ============================================================

    @PutMapping("/users/{userId}/reject")
    public ResponseEntity<?> rejectUser(
            @PathVariable String userId) {

        Authentication auth =
                SecurityContextHolder.getContext().getAuthentication();

        if (auth == null ||
                !(auth.getPrincipal() instanceof UserEntity)) {

            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body("Authentication is required");
        }

        UserEntity currentUser =
                (UserEntity) auth.getPrincipal();

        if (currentUser.getRole() != UserRole.ADMIN) {

            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body("Only Admin can reject users");
        }

        return userRepository.findById(userId)
                .map(user -> {

                    if (user.getStatus() == UserStatus.PENDING) {

                        user.setStatus(UserStatus.REJECTED);
                        user.setUpdatedAt(LocalDateTime.now());

                        userRepository.save(user);

                        Map<String, Object> response =
                                new HashMap<>();

                        response.put(
                                "message",
                                "User rejected successfully"
                        );

                        response.put(
                                "userId",
                                user.getId()
                        );

                        response.put(
                                "email",
                                user.getEmail()
                        );

                        response.put(
                                "name",
                                user.getName()
                        );

                        response.put(
                                "status",
                                user.getStatus().toString()
                        );

                        return ResponseEntity.ok(response);

                    } else {

                        return ResponseEntity
                                .badRequest()
                                .body(
                                        "User is not in PENDING status"
                                );
                    }
                })
                .orElse(
                        ResponseEntity
                                .notFound()
                                .build()
                );
    }

    // ============================================================
    // SUSPEND USER
    // ============================================================

    @PutMapping("/users/{userId}/suspend")
    public ResponseEntity<?> suspendUser(
            @PathVariable String userId) {

        Authentication auth =
                SecurityContextHolder.getContext().getAuthentication();

        if (auth == null ||
                !(auth.getPrincipal() instanceof UserEntity)) {

            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body("Authentication is required");
        }

        UserEntity currentUser =
                (UserEntity) auth.getPrincipal();

        if (currentUser.getRole() != UserRole.ADMIN) {

            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body("Only Admin can suspend users");
        }

        return userRepository.findById(userId)
                .map(user -> {

                    if (user.getStatus() == UserStatus.ACTIVE) {

                        user.setStatus(UserStatus.SUSPENDED);
                        user.setUpdatedAt(LocalDateTime.now());

                        userRepository.save(user);

                        Map<String, Object> response =
                                new HashMap<>();

                        response.put(
                                "message",
                                "User suspended successfully"
                        );

                        response.put(
                                "userId",
                                user.getId()
                        );

                        response.put(
                                "email",
                                user.getEmail()
                        );

                        response.put(
                                "name",
                                user.getName()
                        );

                        response.put(
                                "status",
                                user.getStatus().toString()
                        );

                        return ResponseEntity.ok(response);

                    } else {

                        return ResponseEntity
                                .badRequest()
                                .body(
                                        "User is not in ACTIVE status"
                                );
                    }
                })
                .orElse(
                        ResponseEntity
                                .notFound()
                                .build()
                );
    }

    // ============================================================
    // ACTIVATE SUSPENDED USER
    // ============================================================

    @PutMapping("/users/{userId}/activate")
    public ResponseEntity<?> activateUser(
            @PathVariable String userId) {

        Authentication auth =
                SecurityContextHolder.getContext().getAuthentication();

        if (auth == null ||
                !(auth.getPrincipal() instanceof UserEntity)) {

            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body("Authentication is required");
        }

        UserEntity currentUser =
                (UserEntity) auth.getPrincipal();

        if (currentUser.getRole() != UserRole.ADMIN) {

            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body("Only Admin can activate users");
        }

        return userRepository.findById(userId)
                .map(user -> {

                    if (user.getStatus() ==
                            UserStatus.SUSPENDED) {

                        user.setStatus(UserStatus.ACTIVE);
                        user.setUpdatedAt(LocalDateTime.now());

                        userRepository.save(user);

                        Map<String, Object> response =
                                new HashMap<>();

                        response.put(
                                "message",
                                "User activated successfully"
                        );

                        response.put(
                                "userId",
                                user.getId()
                        );

                        response.put(
                                "email",
                                user.getEmail()
                        );

                        response.put(
                                "name",
                                user.getName()
                        );

                        response.put(
                                "status",
                                user.getStatus().toString()
                        );

                        return ResponseEntity.ok(response);

                    } else {

                        return ResponseEntity
                                .badRequest()
                                .body(
                                        "User is not in SUSPENDED status"
                                );
                    }
                })
                .orElse(
                        ResponseEntity
                                .notFound()
                                .build()
                );
    }

    // ============================================================
    // DELETE USER
    // ============================================================

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<?> deleteUser(
            @PathVariable String userId) {

        Authentication auth =
                SecurityContextHolder.getContext().getAuthentication();

        if (auth == null ||
                !(auth.getPrincipal() instanceof UserEntity)) {

            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body("Authentication is required");
        }

        UserEntity currentUser =
                (UserEntity) auth.getPrincipal();

        if (currentUser.getRole() != UserRole.ADMIN) {

            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body("Only Admin can delete users");
        }

        // Prevent admin from deleting their own account
        if (currentUser.getId().equals(userId)) {

            return ResponseEntity
                    .badRequest()
                    .body("You cannot delete your own admin account");
        }

        if (userRepository.existsById(userId)) {

            userRepository.deleteById(userId);

            return ResponseEntity.ok(
                    "User deleted successfully"
            );
        }

        return ResponseEntity
                .notFound()
                .build();
    }
}