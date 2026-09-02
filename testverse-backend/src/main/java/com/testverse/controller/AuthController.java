package com.testverse.controller;

import com.testverse.model.UserEntity;
import com.testverse.model.UserRole;
import com.testverse.model.UserStatus;
import com.testverse.repository.UserRepository;
import com.testverse.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    // ✅ Register - Sets status to PENDING (needs admin approval)
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String password = request.get("password");
            String name = request.get("name");
            String role = request.get("role");

            // Validate required fields
            if (email == null || email.isEmpty()) {
                return ResponseEntity.badRequest().body("Email is required");
            }
            if (password == null || password.isEmpty()) {
                return ResponseEntity.badRequest().body("Password is required");
            }
            if (name == null || name.isEmpty()) {
                return ResponseEntity.badRequest().body("Name is required");
            }

            // Check if email already exists
            if (userRepository.findByEmail(email).isPresent()) {
                return ResponseEntity.badRequest().body("Email already registered");
            }

            // Determine role (default to DEVELOPER if not specified)
            UserRole userRole = UserRole.DEVELOPER;
            if (role != null && !role.isEmpty()) {
                try {
                    userRole = UserRole.valueOf(role.toUpperCase());
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest().body("Invalid role. Allowed: ADMIN, DEVELOPER, TESTER");
                }
            }

            // Create user with PENDING status
            UserEntity user = new UserEntity();
            user.setEmail(email);
            user.setUsername(email); // ✅ Set username as email for compatibility
            user.setPassword(passwordEncoder.encode(password));
            user.setName(name);
            user.setRole(userRole);
            user.setStatus(UserStatus.PENDING);
            user.setCreatedAt(LocalDateTime.now());

            UserEntity savedUser = userRepository.save(user);

            // Return response without token (user needs approval)
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Registration successful! Please wait for admin approval.");
            response.put("id", savedUser.getId());
            response.put("email", savedUser.getEmail());
            response.put("name", savedUser.getName());
            response.put("role", savedUser.getRole().toString());
            response.put("status", savedUser.getStatus().toString());
            response.put("requiresApproval", true);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Registration failed: " + e.getMessage());
        }
    }

    // ✅ Login - Only ACTIVE users can login
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String password = request.get("password");

            if (email == null || email.isEmpty()) {
                return ResponseEntity.badRequest().body("Email is required");
            }
            if (password == null || password.isEmpty()) {
                return ResponseEntity.badRequest().body("Password is required");
            }

            UserEntity user = userRepository.findByEmail(email)
                    .orElse(null);

            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Invalid email or password");
            }

            // ✅ Check if user is PENDING
            if (user.getStatus() == UserStatus.PENDING) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Your account is pending admin approval. Please wait.");
            }

            // ✅ Check if user is REJECTED
            if (user.getStatus() == UserStatus.REJECTED) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Your registration was rejected. Contact admin.");
            }

            // ✅ Check if user is SUSPENDED
            if (user.getStatus() == UserStatus.SUSPENDED) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Your account has been suspended. Contact admin.");
            }

            // Check password
            if (!passwordEncoder.matches(password, user.getPassword())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Invalid email or password");
            }

            // ✅ Generate token using email (username is email)
            String token = jwtService.generateToken(user.getUsername());

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
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Login failed: " + e.getMessage());
        }
    }
}