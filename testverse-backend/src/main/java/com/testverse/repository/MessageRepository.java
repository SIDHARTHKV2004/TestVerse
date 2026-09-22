package com.testverse.repository;

import com.testverse.model.MessageEntity;
import com.testverse.model.MessageType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<MessageEntity, Long> {

    // ==================== GENERAL CHAT ====================

    // Get all General chat messages
    List<MessageEntity> findByMessageTypeOrderByCreatedAtAsc(
            MessageType messageType
    );

    // ==================== DIRECT CHAT ====================

    // Get direct messages between two users
    List<MessageEntity> findByMessageTypeAndSenderIdAndReceiverIdOrMessageTypeAndSenderIdAndReceiverIdOrderByCreatedAtAsc(
            MessageType messageType1,
            String senderId1,
            String receiverId1,
            MessageType messageType2,
            String senderId2,
            String receiverId2
    );

    // ==================== EXISTING METHODS ====================
    // Kept temporarily while we migrate away from Team Chat.

    // Get messages by team
    List<MessageEntity> findByTeamIdOrderByCreatedAtDesc(
            Long teamId
    );

    // Get messages by team OR broadcast messages
    List<MessageEntity> findByTeamIdOrIsBroadcastOrderByCreatedAtDesc(
            Long teamId,
            Boolean isBroadcast
    );

    // Get all messages
    List<MessageEntity> findAllByOrderByCreatedAtDesc();

    // Get messages by sender
    List<MessageEntity> findBySenderIdOrderByCreatedAtDesc(
            String senderId
    );
}