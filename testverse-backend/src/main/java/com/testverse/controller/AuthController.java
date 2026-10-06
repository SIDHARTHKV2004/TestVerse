package com.testverse.controller;

import com.testverse.model.NotificationEntity;
import com.testverse.model.UserEntity;
import com.testverse.model.UserRole;
import com.testverse.model.UserStatus;
import com.testverse.repository.NotificationRepository;
import com.testverse.repository.UserRepository;
import com.testverse.security.JwtService;
import com.testverse.service.AttendanceService;
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
    private final AttendanceService attendanceService;

    // ============================================================
    // REGISTER
    // New users are created with PENDING status.
    // Admin must approve the account before login is allowed.
    // ============================================================
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, Object> request) {
        try {
            String email = request.get("email") != null ? request.get("email").toString().trim() : null;
            String password = request.get("password") != null ? request.get("password").toString() : null;
            String name = request.get("name") != null ? request.get("name").toString().trim() : null;
            String role = request.get("role") != null ? request.get("role").toString().trim() : null;
            String mentorIdStr = request.get("mentorId") != null ? request.get("mentorId").toString().trim() : null;

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
            // Validate Mentor Requirements
            // Tester and Developer roles strictly require an active,
            // eligible mentor from their respective department.
            // ----------------------------------------------------
            UserEntity mentor = null;
            if (userRole == UserRole.TESTER || userRole == UserRole.DEVELOPER) {
                if (mentorIdStr == null || mentorIdStr.isEmpty()) {
                    return ResponseEntity.badRequest()
                            .body("A mentor is strictly required for " + userRole + " registration");
                }

                Long mentorId;
                try {
                    mentorId = Long.parseLong(mentorIdStr);
                } catch (NumberFormatException e) {
                    return ResponseEntity.badRequest()
                            .body("Invalid mentor ID format");
                }

                mentor = userRepository.findById(mentorId).orElse(null);
                if (mentor == null) {
                    return ResponseEntity.badRequest()
                            .body("Selected mentor not found");
                }

                if (mentor.getRole() != UserRole.MENTOR) {
                    return ResponseEntity.badRequest()
                            .body("Selected user is not a mentor");
                }

                if (mentor.getStatus() != UserStatus.ACTIVE) {
                    return ResponseEntity.badRequest()
                            .body("Selected mentor is not active");
                }

                // Check role-mentor compatibility
                boolean isEligible = (userRole == UserRole.TESTER)
                        ? mentor.canMentorTester()
                        : mentor.canMentorDeveloper();

                if (!isEligible) {
                    return ResponseEntity.badRequest()
                            .body("Selected mentor (" + mentor.getName() + " - " + mentor.getDepartment() + ") is not eligible to mentor " + userRole + "s");
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

            if (mentor != null) {
                user.setMentor(mentor);
                user.setDepartment(userRole == UserRole.TESTER ? "TESTING" : "DEVELOPMENT");
            }

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
            if (savedUser.getMentor() != null) {
                response.put("mentorId", savedUser.getMentor().getId());
                response.put("mentorName", savedUser.getMentor().getName());
            }

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
            if (email == null || email.trim().isEmpty()) {
                email = request.get("username");
            }
            String password = request.get("password");

            // ----------------------------------------------------
            // Validate required fields
            // ----------------------------------------------------
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity
                        .badRequest()
                        .body("Email is required");
            }

            if (password == null || password.isEmpty()) {
                return ResponseEntity
                        .badRequest()
                        .body("Password is required");
            }

            final String searchKey = email.trim();

            // ----------------------------------------------------
            // Find user
            // ----------------------------------------------------
            UserEntity user = userRepository
                    .findByEmail(searchKey)
                    .or(() -> userRepository.findByUsername(searchKey))
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
            // Automatic Daily Attendance Recording
            // Recorded immediately after successful authentication
            // ----------------------------------------------------
            try {
                attendanceService.recordAttendance(user);
            } catch (Exception attEx) {
                System.err.println("Notice: Could not record attendance during login: " + attEx.getMessage());
            }

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
            response.put("department", user.getDepartment());
            response.put("domain", user.getDepartment());
            if (user.getRole() == UserRole.MENTOR) {
                response.put("canMentorDeveloper", user.canMentorDeveloper());
                response.put("canMentorTester", user.canMentorTester());
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Login failed: " + e.getMessage());
        }
    }
    // ============================================================
    // ============================================================
    // GET ELIGIBLE MENTORS
    // Returns active mentors filtered by role (TESTER or DEVELOPER)
    // or legacy department (TESTING or DEVELOPMENT).
    // If no filter is specified, returns all active mentors.
    // Example:
    // /api/auth/mentors?role=TESTER
    // ============================================================
    @GetMapping("/mentors")
    public ResponseEntity<?> getMentors(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String department) {

        try {
            UserRole targetRole = null;
            if (role != null && !role.isBlank()) {
                String r = role.trim().toUpperCase();
                if ("TESTER".equals(r)) {
                    targetRole = UserRole.TESTER;
                } else if ("DEVELOPER".equals(r)) {
                    targetRole = UserRole.DEVELOPER;
                }
            } else if (department != null && !department.isBlank()) {
                String d = department.trim().toUpperCase();
                if ("TESTING".equals(d)) {
                    targetRole = UserRole.TESTER;
                } else if ("DEVELOPMENT".equals(d)) {
                    targetRole = UserRole.DEVELOPER;
                }
            }

            List<UserEntity> allMentors =
                    userRepository.findByRoleAndStatus(UserRole.MENTOR, UserStatus.ACTIVE);

            final UserRole finalTargetRole = targetRole;
            List<UserEntity> eligibleMentors = allMentors.stream()
                    .filter(m -> {
                        if (finalTargetRole == UserRole.TESTER) {
                            return m.canMentorTester();
                        } else if (finalTargetRole == UserRole.DEVELOPER) {
                            return m.canMentorDeveloper();
                        }
                        return true;
                    })
                    .toList();

            List<Map<String, Object>> mentorList = eligibleMentors.stream()
                    .map(mentor -> {
                        Map<String, Object> mentorData = new HashMap<>();
                        mentorData.put("id", String.valueOf(mentor.getId()));
                        mentorData.put("name", mentor.getName());
                        mentorData.put("email", mentor.getEmail());
                        mentorData.put("department", mentor.getDepartment());
                        mentorData.put("domain", mentor.getDepartment());
                        mentorData.put("canMentorDeveloper", mentor.canMentorDeveloper());
                        mentorData.put("canMentorTester", mentor.canMentorTester());

                        long activeCount = finalTargetRole != null
                                ? userRepository.countByMentorAndRoleAndStatus(mentor, finalTargetRole, UserStatus.ACTIVE)
                                : userRepository.countByMentorAndStatus(mentor, UserStatus.ACTIVE);
                        mentorData.put("activeCount", activeCount);

                        return mentorData;
                    })
                    .toList();

            return ResponseEntity.ok(mentorList);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to load mentors");
        }
    }
}