package com.testverse.repository;

import com.testverse.model.TeamEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamRepository extends JpaRepository<TeamEntity, Long> {

    Optional<TeamEntity> findByName(String name);

    List<TeamEntity> findByAdminId(Long adminId);

    @Query("SELECT t FROM TeamEntity t JOIN t.members m WHERE m.id = :userId")
    List<TeamEntity> findByMembersId(@Param("userId") Long userId);
}