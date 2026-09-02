package com.testverse.repository;

import com.testverse.model.InvitationEntity;
import com.testverse.model.InvitationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvitationRepository extends JpaRepository<InvitationEntity, Long> {

    List<InvitationEntity> findByEmail(String email);

    List<InvitationEntity> findByEmailAndStatus(String email, InvitationStatus status);

    Optional<InvitationEntity> findByEmailAndTeamId(String email, Long teamId);

    List<InvitationEntity> findByStatus(InvitationStatus status);
}