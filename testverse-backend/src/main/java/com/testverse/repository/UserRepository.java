package com.testverse.repository;

import com.testverse.model.UserEntity;
import com.testverse.model.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, Long> {
    Optional<UserEntity> findByEmail(String email);

    // ✅ Add this method - it's used by many controllers
    Optional<UserEntity> findByUsername(String username);

    List<UserEntity> findByStatus(UserStatus status);

    boolean existsByEmail(String email);
}