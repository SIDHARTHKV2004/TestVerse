package com.testverse.controller;

import com.testverse.model.NotificationEntity;
import com.testverse.model.UserEntity;
import com.testverse.model.UserRole;
import com.testverse.model.UserStatus;
import com.testverse.repository.NotificationRepository;
import com.testverse.repository.UserRepository;
import com.testverse.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final NotificationRepository notificationRepository;

    // ============================================================
    // REGISTER
    // New users are created with PENDING status.
    // Admin must approve the account before login is allowed.
    // ============================================================
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String password = request.get("password");
            String name = request.get("name");
            String role = request.get("role");

            // ----------------------------------------------------
            // Validate required fields
            // ----------------------------------------------------
            if (email == null || email.isEmpty()) {
                return ResponseEntity.badRequest().body("Email is required");
            }

            if (password == null || password.isEmpty()) {
                return ResponseEntity.badRequest().body("Password is required");
            }

            if (name == null || name.isEmpty()) {
                return ResponseEntity.badRequest().body("Name is required");
            }

            // ----------------------------------------------------
            // Check if email already exists
            // ----------------------------------------------------
            if (userRepository.findByEmail(email).isPresent()) {
                return ResponseEntity.badRequest()
                        .body("Email already registered");
            }

            // ----------------------------------------------------
            // Determine role
            // Default role = DEVELOPER
            // ----------------------------------------------------
            UserRole userRole = UserRole.DEVELOPER;

            if (role != null && !role.isEmpty()) {
                try {
                    userRole = UserRole.valueOf(role.toUpperCase());
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest()
                            .body("Invalid role. Allowed: ADMIN, DEVELOPER, TESTER");
                }
            }

            // ----------------------------------------------------
            // Create new user
            // ----------------------------------------------------
            UserEntity user = new UserEntity();

            user.setEmail(email);
            user.setUsername(email);

            // Store the encoded password in password_hash.
            user.setPasswordHash(passwordEncoder.encode(password));

            user.setName(name);
            user.setRole(userRole);

            // IMPORTANT:
            // New users must wait for admin approval.
            user.setStatus(UserStatus.PENDING);

            user.setCreatedAt(LocalDateTime.now());

            // ----------------------------------------------------
            // Save user
            // ----------------------------------------------------
            UserEntity savedUser = userRepository.save(user);

            // ====================================================
            // CREATE ADMIN NOTIFICATION
            // ====================================================
            // Find all users whose role is ADMIN.
            List<UserEntity> admins =
                    userRepository.findByRole(UserRole.ADMIN);

            // Create one notification for each admin.
            for (UserEntity admin : admins) {

                NotificationEntity notification =
                        new NotificationEntity();

                notification.setTitle("New Registration Request");

                notification.setMessage(
                        savedUser.getName()
                                + " has registered as "
                                + savedUser.getRole().toString()
                                + " and is waiting for admin approval."
                );

                // The notification belongs to this admin.
                notification.setUser(admin);

                // SYSTEM notification because this is an
                // automatic system-generated notification.
                notification.setType("SYSTEM");

                // Store the newly registered user's ID.
                notification.setSenderId(savedUser.getId());

                // Notification starts as unread.
                notification.setIsRead(false);

                // This is not a team invitation.
                notification.setIsAccepted(false);

                notification.setCreatedAt(LocalDateTime.now());
                notification.setUpdatedAt(LocalDateTime.now());

                // Save notification.
                notificationRepository.save(notification);
            }

            // ----------------------------------------------------
            // Return registration response
            // ----------------------------------------------------
            Map<String, Object> response = new HashMap<>();

            response.put(
                    "message",
                    "Registration successful! Please wait for admin approval."
            );

            response.put("id", savedUser.getId());
            response.put("email", savedUser.getEmail());
            response.put("name", savedUser.getName());
            response.put("role", savedUser.getRole().toString());
            response.put("status", savedUser.getStatus().toString());
            response.put("requiresApproval", true);

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(response);

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Registration failed: " + e.getMessage());
        }
    }

    // ============================================================
    // LOGIN
    // Only ACTIVE users can login.
    // ============================================================
    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody Map<String, String> request) {

        try {

            String email = request.get("email");
            String password = request.get("password");

            // ----------------------------------------------------
            // Validate required fields
            // ----------------------------------------------------
            if (email == null || email.isEmpty()) {
                return ResponseEntity
                        .badRequest()
                        .body("Email is required");
            }

            if (password == null || password.isEmpty()) {
                return ResponseEntity
                        .badRequest()
                        .body("Password is required");
            }

            // ----------------------------------------------------
            // Find user
            // ----------------------------------------------------
            UserEntity user = userRepository
                    .findByEmail(email)
                    .orElse(null);

            if (user == null) {

                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body("Invalid email or password");
            }

            // ----------------------------------------------------
            // Check PENDING status
            // ----------------------------------------------------
            if (user.getStatus() == UserStatus.PENDING) {

                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body(
                                "Your account is pending admin approval. Please wait."
                        );
            }

            // ----------------------------------------------------
            // Check REJECTED status
            // ----------------------------------------------------
            if (user.getStatus() == UserStatus.REJECTED) {

                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body(
                                "Your registration was rejected. Contact admin."
                        );
            }

            // ----------------------------------------------------
            // Check SUSPENDED status
            // ----------------------------------------------------
            if (user.getStatus() == UserStatus.SUSPENDED) {

                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body(
                                "Your account has been suspended. Contact admin."
                        );
            }

            // ----------------------------------------------------
            // Check password
            // ----------------------------------------------------
            if (!passwordEncoder.matches(
                    password,
                    user.getPasswordHash())) {

                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body("Invalid email or password");
            }

            // ----------------------------------------------------
            // Generate JWT token
            // Username is email.
            // ----------------------------------------------------
            String token =
                    jwtService.generateToken(user.getUsername());

            // ----------------------------------------------------
            // Return login response
            // ----------------------------------------------------
            Map<String, Object> response = new HashMap<>();

            response.put("token", token);
            response.put("userId", user.getId());
            response.put("email", user.getEmail());
            response.put("name", user.getName());
            response.put("role", user.getRole().toString());
            response.put("status", user.getStatus().toString());

            return ResponseEntity.ok(response);

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Login failed: " + e.getMessage());
        }
    }
}