package com.testverse.config;

import com.testverse.model.*;
import com.testverse.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {

        // ============================================================
        // CREATE ADMIN USER
        // ============================================================
        if (userRepository.findByEmail("admin@testverse.com").isEmpty()) {

            UserEntity admin = UserEntity.builder()
                    .email("admin@testverse.com")
                    .username("admin@testverse.com")
                    .passwordHash(passwordEncoder.encode("admin123"))
                    .name("Admin User")
                    .role(UserRole.ADMIN)
                    .status(UserStatus.ACTIVE)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            userRepository.save(admin);
        }

        // ============================================================
        // CREATE TESTER USER
        // ============================================================
        if (userRepository.findByEmail("tester@testverse.com").isEmpty()) {

            UserEntity tester = UserEntity.builder()
                    .email("tester@testverse.com")
                    .username("tester@testverse.com")
                    .passwordHash(passwordEncoder.encode("tester123"))
                    .name("Tester User")
                    .role(UserRole.TESTER)
                    .status(UserStatus.ACTIVE)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            userRepository.save(tester);
        }

        // ============================================================
        // CREATE DEVELOPER USER
        // ============================================================
        if (userRepository.findByEmail("developer@testverse.com").isEmpty()) {

            UserEntity developer = UserEntity.builder()
                    .email("developer@testverse.com")
                    .username("developer@testverse.com")
                    .passwordHash(passwordEncoder.encode("developer123"))
                    .name("Developer User")
                    .role(UserRole.DEVELOPER)
                    .status(UserStatus.ACTIVE)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            userRepository.save(developer);
        }

        // ============================================================
        // CREATE / UPDATE MENTOR USER
        // ============================================================
        var mentorOpt = userRepository.findByEmail("mentor@testverse.io");
        if (mentorOpt.isEmpty()) {

            UserEntity mentor = UserEntity.builder()
                    .email("mentor@testverse.io")
                    .username("mentor@testverse.io")
                    .passwordHash(passwordEncoder.encode("mentor123"))
                    .name("Lead QA Mentor")
                    .role(UserRole.MENTOR)
                    .status(UserStatus.ACTIVE)
                    .department("TESTING")
                    .canMentorTester(true)
                    .canMentorDeveloper(false)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            userRepository.save(mentor);
        } else {
            UserEntity existingMentor = mentorOpt.get();
            boolean changed = false;
            if (existingMentor.getDepartment() == null || existingMentor.getDepartment().isBlank()) {
                existingMentor.setDepartment("TESTING");
                changed = true;
            }
            if (existingMentor.getCanMentorTester() == null) {
                existingMentor.setCanMentorTester(true);
                changed = true;
            }
            if (changed) {
                existingMentor.setUpdatedAt(LocalDateTime.now());
                userRepository.save(existingMentor);
            }
        }

        // ============================================================
        // CREATE / UPDATE DEVELOPMENT MENTOR
        // ============================================================
        var devMentorOpt = userRepository.findByEmail("devmentor@testverse.io");
        if (devMentorOpt.isEmpty()) {

            UserEntity devMentor = UserEntity.builder()
                    .email("devmentor@testverse.io")
                    .username("devmentor@testverse.io")
                    .passwordHash(passwordEncoder.encode("mentor123"))
                    .name("Development Mentor")
                    .role(UserRole.MENTOR)
                    .status(UserStatus.ACTIVE)
                    .department("DEVELOPMENT")
                    .canMentorDeveloper(true)
                    .canMentorTester(false)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            userRepository.save(devMentor);
        } else {
            UserEntity existingDevMentor = devMentorOpt.get();
            boolean changed = false;
            if (existingDevMentor.getDepartment() == null || existingDevMentor.getDepartment().isBlank()) {
                existingDevMentor.setDepartment("DEVELOPMENT");
                changed = true;
            }
            if (existingDevMentor.getCanMentorDeveloper() == null) {
                existingDevMentor.setCanMentorDeveloper(true);
                changed = true;
            }
            if (changed) {
                existingDevMentor.setUpdatedAt(LocalDateTime.now());
                userRepository.save(existingDevMentor);
            }
        }
    }
}