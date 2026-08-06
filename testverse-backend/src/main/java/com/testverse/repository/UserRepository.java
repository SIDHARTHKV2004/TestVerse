package com.testverse.repository;

import com.testverse.model.UserEntity;
import com.testverse.model.UserRole;
import com.testverse.model.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, Long> {
    Optional<UserEntity> findByUsername(String username);
    Optional<UserEntity> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    List<UserEntity> findByRole(UserRole role);
    List<UserEntity> findByStatus(UserStatus status);
}