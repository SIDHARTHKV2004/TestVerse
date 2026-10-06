package com.testverse.repository;

import com.testverse.model.TeamMembershipEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamMembershipRepository extends JpaRepository<TeamMembershipEntity, Long> {

    List<TeamMembershipEntity> findByTeamId(Long teamId);

    List<TeamMembershipEntity> findByUserId(Long userId);

    Optional<TeamMembershipEntity> findByTeamIdAndUserId(Long teamId, Long userId);

    boolean existsByTeamIdAndUserId(Long teamId, Long userId);

    long countByUserId(Long userId);

    void deleteByTeamIdAndUserId(Long teamId, Long userId);

    void deleteByTeamId(Long teamId);

    @Query("SELECT tm FROM TeamMembershipEntity tm JOIN FETCH tm.team WHERE tm.user.id = :userId")
    List<TeamMembershipEntity> findByUserIdWithTeam(@Param("userId") Long userId);
}
