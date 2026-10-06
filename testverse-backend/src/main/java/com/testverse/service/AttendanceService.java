package com.testverse.service;

import com.testverse.model.AttendanceEntity;
import com.testverse.model.AttendanceStatus;
import com.testverse.model.UserEntity;
import com.testverse.model.UserRole;
import com.testverse.model.UserStatus;
import com.testverse.repository.AttendanceRepository;
import com.testverse.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final UserRepository userRepository;

    // ============================================================
    // RECORD ATTENDANCE FOR TODAY
    // Idempotent: at most one record per user per date.
    // Updates lastActiveAt on repeated activities/logins on the same day.
    // ============================================================
    @Transactional
    public AttendanceEntity recordAttendance(UserEntity user) {
        if (user == null || user.getId() == null) {
            return null;
        }

        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();

        Optional<AttendanceEntity> existing =
                attendanceRepository.findByUserIdAndAttendanceDate(user.getId(), today);

        if (existing.isPresent()) {
            AttendanceEntity attendance = existing.get();
            attendance.setStatus(AttendanceStatus.PRESENT);
            attendance.setLastActiveAt(now);
            attendance.setUpdatedAt(now);

            user.setLastActiveAt(now);
            userRepository.save(user);

            return attendanceRepository.save(attendance);
        } else {
            try {
                AttendanceEntity attendance = AttendanceEntity.builder()
                        .user(user)
                        .attendanceDate(today)
                        .status(AttendanceStatus.PRESENT)
                        .firstActiveAt(now)
                        .lastActiveAt(now)
                        .createdAt(now)
                        .updatedAt(now)
                        .build();

                user.setLastActiveAt(now);
                userRepository.save(user);

                return attendanceRepository.save(attendance);
            } catch (Exception ex) {
                // Handle potential race condition on unique constraint
                return attendanceRepository.findByUserIdAndAttendanceDate(user.getId(), today)
                        .map(att -> {
                            att.setStatus(AttendanceStatus.PRESENT);
                            att.setLastActiveAt(now);
                            att.setUpdatedAt(now);
                            return attendanceRepository.save(att);
                        })
                        .orElse(null);
            }
        }
    }

    // ============================================================
    // GET ACTIVE PEOPLE TODAY
    // Accessible by all authenticated users.
    // Returns users who have a PRESENT attendance record for today.
    // ============================================================
    public List<Map<String, Object>> getTodayActiveUsers() {
        LocalDate today = LocalDate.now();
        List<AttendanceEntity> records = attendanceRepository.findByAttendanceDate(today);

        return records.stream()
                .filter(a -> a.getStatus() == AttendanceStatus.PRESENT && a.getUser() != null)
                .map(a -> {
                    UserEntity u = a.getUser();
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", u.getId());
                    map.put("name", u.getName());
                    map.put("username", u.getUsername());
                    map.put("email", u.getEmail());
                    map.put("role", u.getRole() != null ? u.getRole().name() : "USER");
                    map.put("department", u.getDepartment());
                    map.put("status", "PRESENT");
                    map.put("firstActiveAt", a.getFirstActiveAt() != null ? a.getFirstActiveAt().toString() : null);
                    map.put("lastActiveAt", a.getLastActiveAt() != null ? a.getLastActiveAt().toString() : null);
                    return map;
                })
                .sorted((a, b) -> {
                    String timeA = (String) a.get("lastActiveAt");
                    String timeB = (String) b.get("lastActiveAt");
                    if (timeA == null && timeB == null) return 0;
                    if (timeA == null) return 1;
                    if (timeB == null) return -1;
                    return timeB.compareTo(timeA); // Most recent first
                })
                .toList();
    }

    // ============================================================
    // GET ATTENDANCE FOR A SELECTED DATE
    // Authorization:
    // ADMIN: Can view system-wide attendance for all active users.
    // MENTOR: Can view attendance only for their assigned mentees
    //         and users within their department, plus themselves.
    // ============================================================
    public List<Map<String, Object>> getAttendanceForDate(LocalDate date, UserEntity requestingUser) {
        if (requestingUser == null || requestingUser.getRole() == null) {
            throw new SecurityException("Unauthorized");
        }

        List<UserEntity> eligibleUsers;

        if (requestingUser.getRole() == UserRole.ADMIN) {
            // Admins can see all active users across the platform
            eligibleUsers = userRepository.findAll().stream()
                    .filter(u -> u.getStatus() == null || u.getStatus() == UserStatus.ACTIVE)
                    .toList();
        } else if (requestingUser.getRole() == UserRole.MENTOR) {
            // Mentors can only see their assigned mentees and department colleagues
            final Long mentorId = requestingUser.getId();
            final String mentorDept = requestingUser.getDepartment() != null
                    ? requestingUser.getDepartment().trim().toUpperCase()
                    : "";

            eligibleUsers = userRepository.findAll().stream()
                    .filter(u -> u.getStatus() == null || u.getStatus() == UserStatus.ACTIVE)
                    .filter(u -> {
                        // Include the mentor themselves
                        if (u.getId().equals(mentorId)) {
                            return true;
                        }
                        // Assigned mentees
                        if (u.getMentor() != null && u.getMentor().getId().equals(mentorId)) {
                            return true;
                        }
                        // Department colleagues (Testers/Developers under this mentor's department)
                        if (!mentorDept.isEmpty() && u.getDepartment() != null
                                && u.getDepartment().trim().equalsIgnoreCase(mentorDept)
                                && u.getRole() != UserRole.ADMIN) {
                            return true;
                        }
                        return false;
                    })
                    .toList();
        } else {
            throw new SecurityException("Access denied: only Admins and Mentors can view attendance records.");
        }

        // Fetch all attendance records on this date
        List<AttendanceEntity> dateRecords = attendanceRepository.findByAttendanceDate(date);
        Map<Long, AttendanceEntity> attendanceByUserId = new HashMap<>();
        for (AttendanceEntity record : dateRecords) {
            if (record.getUser() != null) {
                attendanceByUserId.put(record.getUser().getId(), record);
            }
        }

        // Map each eligible user to PRESENT or ABSENT
        List<Map<String, Object>> result = new ArrayList<>();
        for (UserEntity u : eligibleUsers) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("name", u.getName());
            map.put("username", u.getUsername());
            map.put("email", u.getEmail());
            map.put("role", u.getRole() != null ? u.getRole().name() : "USER");
            map.put("department", u.getDepartment());
            map.put("attendanceDate", date.toString());

            AttendanceEntity att = attendanceByUserId.get(u.getId());
            if (att != null && att.getStatus() == AttendanceStatus.PRESENT) {
                map.put("status", "PRESENT");
                map.put("firstActiveAt", att.getFirstActiveAt() != null ? att.getFirstActiveAt().toString() : null);
                map.put("lastActiveAt", att.getLastActiveAt() != null ? att.getLastActiveAt().toString() : null);
            } else {
                map.put("status", "ABSENT");
                map.put("firstActiveAt", null);
                map.put("lastActiveAt", null);
            }

            result.add(map);
        }

        // Sort: PRESENT first, then alphabetically by name
        result.sort((a, b) -> {
            String statusA = (String) a.get("status");
            String statusB = (String) b.get("status");
            if (!statusA.equals(statusB)) {
                return "PRESENT".equals(statusA) ? -1 : 1;
            }
            String nameA = (String) a.get("name");
            String nameB = (String) b.get("name");
            return String.valueOf(nameA).compareToIgnoreCase(String.valueOf(nameB));
        });

        return result;
    }
}
