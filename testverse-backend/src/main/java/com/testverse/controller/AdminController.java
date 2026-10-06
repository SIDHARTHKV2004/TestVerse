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
import org.springframework.security.crypto.password.PasswordEncoder;
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
    private final PasswordEncoder passwordEncoder;

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
            @PathVariable Long userId) {

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
            @PathVariable Long userId) {

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
            @PathVariable Long userId) {

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
            @PathVariable Long userId) {

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
            @PathVariable Long userId) {

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

    // ============================================================
    // ASSIGN / REASSIGN MENTOR
    // ============================================================
    @PutMapping("/users/{userId}/mentor")
    public ResponseEntity<?> assignMentor(
            @PathVariable Long userId,
            @RequestBody Map<String, Object> request) {

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
                    .body("Only Admin can assign mentors");
        }

        UserEntity targetUser = userRepository.findById(userId).orElse(null);
        if (targetUser == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }

        if (targetUser.getRole() != UserRole.TESTER && targetUser.getRole() != UserRole.DEVELOPER) {
            return ResponseEntity.badRequest().body("Mentors can only be assigned to TESTER or DEVELOPER users");
        }

        Object mentorIdObj = request.get("mentorId");
        if (mentorIdObj == null || mentorIdObj.toString().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Mentor ID is required");
        }

        Long mentorId;
        try {
            mentorId = Long.parseLong(mentorIdObj.toString().trim());
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body("Invalid mentor ID format");
        }

        UserEntity mentor = userRepository.findById(mentorId).orElse(null);
        if (mentor == null) {
            return ResponseEntity.badRequest().body("Selected mentor not found");
        }

        if (mentor.getRole() != UserRole.MENTOR) {
            return ResponseEntity.badRequest().body("Selected user is not a mentor");
        }

        if (mentor.getStatus() != UserStatus.ACTIVE) {
            return ResponseEntity.badRequest().body("Selected mentor is not active");
        }

        boolean isEligible = (targetUser.getRole() == UserRole.TESTER)
                ? mentor.canMentorTester()
                : mentor.canMentorDeveloper();

        if (!isEligible) {
            return ResponseEntity.badRequest().body(
                    "Selected mentor (" + mentor.getName() + " - " + mentor.getDepartment() + ") is not eligible to mentor " + targetUser.getRole() + "s"
            );
        }

        targetUser.setMentor(mentor);
        if (targetUser.getDepartment() == null || targetUser.getDepartment().trim().isEmpty()) {
            targetUser.setDepartment(targetUser.getRole() == UserRole.TESTER ? "TESTING" : "DEVELOPMENT");
        }
        targetUser.setUpdatedAt(LocalDateTime.now());
        userRepository.save(targetUser);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Mentor assigned successfully");
        response.put("userId", targetUser.getId());
        response.put("mentorId", mentor.getId());
        response.put("mentorName", mentor.getName());
        response.put("mentorDepartment", mentor.getDepartment());
        response.put("mentorDomain", mentor.getDepartment());

        return ResponseEntity.ok(response);
    }

    // ============================================================
    // CREATE MENTOR/FACULTY (ADMIN-ONLY)
    // Creates an active mentor account directly — no approval needed.
    // ============================================================
    @PostMapping("/users/create-mentor")
    public ResponseEntity<?> createMentor(@RequestBody Map<String, Object> request) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !(auth.getPrincipal() instanceof UserEntity)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Authentication is required");
        }

        UserEntity currentUser = (UserEntity) auth.getPrincipal();

        if (currentUser.getRole() != UserRole.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only Admin can create mentor/faculty accounts");
        }

        String email    = request.get("email")    != null ? request.get("email").toString().trim()    : null;
        String name     = request.get("name")     != null ? request.get("name").toString().trim()     : null;
        String password = request.get("password") != null ? request.get("password").toString()       : null;
        String domain   = request.get("domain")   != null ? request.get("domain").toString().trim()   : null;

        if (email == null || email.isEmpty())    return ResponseEntity.badRequest().body("Email is required");
        if (name == null || name.isEmpty())      return ResponseEntity.badRequest().body("Name is required");
        if (password == null || password.length() < 6) return ResponseEntity.badRequest().body("Password must be at least 6 characters");
        if (domain == null || domain.isEmpty())   return ResponseEntity.badRequest().body("Domain / Specialization is required");

        boolean canMentorDev = false;
        if (request.get("canMentorDeveloper") != null) {
            canMentorDev = Boolean.parseBoolean(request.get("canMentorDeveloper").toString().trim());
        }

        boolean canMentorTest = false;
        if (request.get("canMentorTester") != null) {
            canMentorTest = Boolean.parseBoolean(request.get("canMentorTester").toString().trim());
        }

        // Backward compatibility fallback: if neither flag is set, infer from domain if it's DEVELOPMENT or TESTING
        if (!canMentorDev && !canMentorTest) {
            if ("DEVELOPMENT".equalsIgnoreCase(domain)) {
                canMentorDev = true;
            } else if ("TESTING".equalsIgnoreCase(domain)) {
                canMentorTest = true;
            } else {
                return ResponseEntity.badRequest().body("Please select at least one role the mentor can supervise (Developer or Tester)");
            }
        }

        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Email is already registered");
        }

        String hashedPassword = passwordEncoder.encode(password);

        UserEntity mentor = UserEntity.builder()
                .email(email)
                .name(name)
                .username(email)
                .passwordHash(hashedPassword)
                .role(UserRole.MENTOR)
                .status(UserStatus.ACTIVE)
                .department(domain)
                .canMentorDeveloper(canMentorDev)
                .canMentorTester(canMentorTest)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        userRepository.save(mentor);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Mentor account created successfully");
        response.put("userId", mentor.getId());
        response.put("email", mentor.getEmail());
        response.put("name", mentor.getName());
        response.put("username", mentor.getUsername());
        response.put("role", "MENTOR");
        response.put("domain", mentor.getDepartment());
        response.put("department", mentor.getDepartment());
        response.put("canMentorDeveloper", mentor.canMentorDeveloper());
        response.put("canMentorTester", mentor.canMentorTester());
        response.put("status", "ACTIVE");

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}