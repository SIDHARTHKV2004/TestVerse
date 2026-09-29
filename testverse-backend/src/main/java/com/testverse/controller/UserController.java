package com.testverse.controller;

import com.testverse.model.UserEntity;
import com.testverse.model.UserRole;
import com.testverse.model.UserStatus;
import com.testverse.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    // =========================================================
    // GET ACTIVE DEVELOPERS
    //
    // Returns list of developers eligible for task/bug assignment.
    // Respects ACTIVE status and does not leak passwords.
    // =========================================================
    @GetMapping("/developers")
    public ResponseEntity<List<Map<String, Object>>> getActiveDevelopers() {
        List<UserEntity> developers = userRepository.findAll().stream()
                .filter(user -> user.getRole() == UserRole.DEVELOPER)
                .filter(user -> user.getStatus() != null && user.getStatus() == UserStatus.ACTIVE)
                .toList();

        List<Map<String, Object>> response = developers.stream().map(dev -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", dev.getId());
            map.put("name", dev.getName());
            map.put("username", dev.getUsername());
            map.put("email", dev.getEmail());
            map.put("role", dev.getRole().name());
            map.put("department", dev.getDepartment());
            if (dev.getMentor() != null) {
                map.put("mentorId", dev.getMentor().getId());
                map.put("mentorName", dev.getMentor().getName());
            }
            return map;
        }).toList();

        return ResponseEntity.ok(response);
    }
}
