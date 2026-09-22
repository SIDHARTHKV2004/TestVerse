package com.testverse.repository;

import com.testverse.model.UserEntity;
import com.testverse.model.UserRole;
import com.testverse.model.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, String> {

    Optional<UserEntity> findByEmail(String email);

    Optional<UserEntity> findByUsername(String username);

    List<UserEntity> findByStatus(UserStatus status);

    List<UserEntity> findByRole(UserRole role);

    boolean existsByEmail(String email);
}