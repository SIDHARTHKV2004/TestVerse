package com.testverse.repository;

import com.testverse.model.MessageEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<MessageEntity, Long> {

    // Get messages by team (most recent first)
    List<MessageEntity> findByTeamIdOrderByCreatedAtDesc(Long teamId);

    // Get messages by team OR broadcast messages
    List<MessageEntity> findByTeamIdOrIsBroadcastOrderByCreatedAtDesc(Long teamId, Boolean isBroadcast);

    // Get all messages (for admin)
    List<MessageEntity> findAllByOrderByCreatedAtDesc();

    // Get messages by sender
    List<MessageEntity> findBySenderIdOrderByCreatedAtDesc(Long senderId);
}