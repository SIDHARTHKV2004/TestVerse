package com.testverse.config;

import com.testverse.model.UserEntity;
import com.testverse.model.UserRole;
import com.testverse.model.UserStatus;
import com.testverse.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        System.out.println("========================================");
        System.out.println("DataInitializer - Starting...");
        System.out.println("========================================");

        // Create Admin
        if (!userRepository.existsByUsername("admin")) {
            UserEntity admin = UserEntity.builder()
                    .username("admin")
                    .email("admin@testverse.com")
                    .passwordHash(passwordEncoder.encode("admin123"))
                    .name("Administrator")
                    .role(UserRole.ADMIN)
                    .status(UserStatus.APPROVED)
                    .enabled(true)
                    .accountNonExpired(true)
                    .accountNonLocked(true)
                    .credentialsNonExpired(true)
                    .createdAt(LocalDateTime.now())
                    .build();
            userRepository.save(admin);
            System.out.println("✅ Admin user created!");
        } else {
            System.out.println("Admin user already exists");
        }

        // Create Developer
        if (!userRepository.existsByUsername("developer")) {
            UserEntity developer = UserEntity.builder()
                    .username("developer")
                    .email("developer@test.com")
                    .passwordHash(passwordEncoder.encode("developer123"))
                    .name("Developer")
                    .role(UserRole.DEVELOPER)
                    .status(UserStatus.APPROVED)
                    .enabled(true)
                    .accountNonExpired(true)
                    .accountNonLocked(true)
                    .credentialsNonExpired(true)
                    .createdAt(LocalDateTime.now())
                    .build();
            userRepository.save(developer);
            System.out.println("✅ Developer user created!");
        } else {
            System.out.println("Developer user already exists");
        }

        // Create Tester
        if (!userRepository.existsByUsername("tester")) {
            UserEntity tester = UserEntity.builder()
                    .username("tester")
                    .email("tester@test.com")
                    .passwordHash(passwordEncoder.encode("tester123"))
                    .name("Tester")
                    .role(UserRole.TESTER)
                    .status(UserStatus.APPROVED)
                    .enabled(true)
                    .accountNonExpired(true)
                    .accountNonLocked(true)
                    .credentialsNonExpired(true)
                    .createdAt(LocalDateTime.now())
                    .build();
            userRepository.save(tester);
            System.out.println("✅ Tester user created!");
        } else {
            System.out.println("Tester user already exists");
        }

        System.out.println("========================================");
        System.out.println("DataInitializer - Completed!");
        System.out.println("========================================");
    }
}