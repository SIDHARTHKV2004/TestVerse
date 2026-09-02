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
        // Create Admin User
        if (userRepository.findByEmail("admin@testverse.com").isEmpty()) {
            UserEntity admin = UserEntity.builder()
                    .email("admin@testverse.com")
                    .password(passwordEncoder.encode("admin123"))
                    .passwordHash(passwordEncoder.encode("admin123"))
                    .name("Admin User")
                    .role(UserRole.ADMIN)
                    .status(UserStatus.ACTIVE)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            userRepository.save(admin);
        }

        // Create Tester User
        if (userRepository.findByEmail("tester@testverse.com").isEmpty()) {
            UserEntity tester = UserEntity.builder()
                    .email("tester@testverse.com")
                    .password(passwordEncoder.encode("tester123"))
                    .passwordHash(passwordEncoder.encode("tester123"))
                    .name("Tester User")
                    .role(UserRole.TESTER)
                    .status(UserStatus.ACTIVE)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            userRepository.save(tester);
        }

        // Create Developer User
        if (userRepository.findByEmail("developer@testverse.com").isEmpty()) {
            UserEntity developer = UserEntity.builder()
                    .email("developer@testverse.com")
                    .password(passwordEncoder.encode("developer123"))
                    .passwordHash(passwordEncoder.encode("developer123"))
                    .name("Developer User")
                    .role(UserRole.DEVELOPER)
                    .status(UserStatus.ACTIVE)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            userRepository.save(developer);
        }
    }
}