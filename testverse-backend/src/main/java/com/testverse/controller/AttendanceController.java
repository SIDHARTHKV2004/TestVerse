package com.testverse.controller;

import com.testverse.model.AttendanceEntity;
import com.testverse.model.UserEntity;
import com.testverse.model.UserRole;
import com.testverse.repository.UserRepository;
import com.testverse.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;
    private final UserRepository userRepository;

    // Helper: Resolve authenticated UserEntity from Spring Security context
    private UserEntity getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }

        Object principal = auth.getPrincipal();
        if (principal instanceof UserEntity) {
            return (UserEntity) principal;
        }

        String username = null;
        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else if (principal instanceof String) {
            username = (String) principal;
        }

        if (username != null && !username.isBlank()) {
            final String lookupUsername = username;
            return userRepository.findByEmail(lookupUsername)
                    .or(() -> userRepository.findByUsername(lookupUsername))
                    .orElse(null);
        }

        return null;
    }

    // ============================================================
    // CHECK-IN (Automatic Daily Attendance)
    // Marks the currently authenticated user as PRESENT for today.
    // ============================================================
    @PostMapping("/check-in")
    public ResponseEntity<?> checkIn() {
        UserEntity currentUser = getAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Authentication is required");
        }

        try {
            AttendanceEntity attendance = attendanceService.recordAttendance(currentUser);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Attendance recorded successfully");
            response.put("status", "PRESENT");
            response.put("date", attendance != null ? attendance.getAttendanceDate().toString() : LocalDate.now().toString());
            response.put("userId", currentUser.getId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to record attendance: " + e.getMessage());
        }
    }

    // ============================================================
    // GET TODAY'S ACTIVE PEOPLE
    // Accessible by all authenticated users.
    // Powers the "Active Today" navigation indicator & popup.
    // ============================================================
    @GetMapping("/today")
    public ResponseEntity<?> getTodayActiveUsers() {
        UserEntity currentUser = getAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Authentication is required");
        }

        try {
            List<Map<String, Object>> activeUsers = attendanceService.getTodayActiveUsers();
            return ResponseEntity.ok(activeUsers);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to retrieve active users: " + e.getMessage());
        }
    }

    // ============================================================
    // GET ATTENDANCE BY DATE
    // Authorization:
    // ADMIN: Can view system-wide attendance for the date.
    // MENTOR: Can view attendance for their assigned mentees / department.
    // Others: 403 Forbidden.
    // ============================================================
    @GetMapping
    public ResponseEntity<?> getAttendanceByDate(
            @RequestParam(value = "date", required = false) String dateStr) {

        UserEntity currentUser = getAuthenticatedUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Authentication is required");
        }

        if (currentUser.getRole() != UserRole.ADMIN && currentUser.getRole() != UserRole.MENTOR) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Access denied: Only Admins and Mentors can view attendance records");
        }

        LocalDate targetDate = LocalDate.now();
        if (dateStr != null && !dateStr.isBlank()) {
            try {
                targetDate = LocalDate.parse(dateStr.trim());
            } catch (DateTimeParseException e) {
                return ResponseEntity.badRequest()
                        .body("Invalid date format. Expected YYYY-MM-DD");
            }
        }

        try {
            List<Map<String, Object>> records =
                    attendanceService.getAttendanceForDate(targetDate, currentUser);
            return ResponseEntity.ok(records);
        } catch (SecurityException se) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(se.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to retrieve attendance: " + e.getMessage());
        }
    }
}
