package com.testverse.repository;

import com.testverse.model.MessageEntity;
import com.testverse.model.MessageType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

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
            Long senderId1,
            Long receiverId1,
            MessageType messageType2,
            Long senderId2,
            Long receiverId2
    );

    // Unread direct messages for current recipient
    @Query("SELECT COUNT(m) FROM MessageEntity m WHERE m.receiver.id = :receiverId AND (m.isSeen = false OR m.isSeen IS NULL)")
    long countUnreadMessages(@Param("receiverId") Long receiverId);

    @Query("SELECT m FROM MessageEntity m WHERE m.receiver.id = :receiverId AND (m.isSeen = false OR m.isSeen IS NULL)")
    List<MessageEntity> findUnreadMessages(@Param("receiverId") Long receiverId);

    @Query("SELECT m FROM MessageEntity m WHERE (m.receiver.id = :userId OR m.sender.id = :userId) AND m.messageType = com.testverse.model.MessageType.DIRECT ORDER BY m.createdAt DESC")
    List<MessageEntity> findRecentDirectMessagesForUser(@Param("userId") Long userId);

    // ==================== GENERAL CHAT UNREAD ====================

    @Query("SELECT MAX(m.id) FROM MessageEntity m WHERE m.messageType = com.testverse.model.MessageType.GENERAL")
    Long findLatestGeneralMessageId();

    @Query("SELECT COUNT(m) FROM MessageEntity m WHERE m.messageType = com.testverse.model.MessageType.GENERAL AND (m.sender IS NULL OR m.sender.id <> :userId) AND (:lastReadId IS NULL OR m.id > :lastReadId)")
    long countUnreadGeneralMessages(@Param("userId") Long userId, @Param("lastReadId") Long lastReadId);

    @Query("SELECT m FROM MessageEntity m WHERE m.messageType = com.testverse.model.MessageType.GENERAL ORDER BY m.createdAt DESC")
    List<MessageEntity> findRecentGeneralMessages();

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
            Long senderId
    );

    // ==================== TEAM CHAT ====================

    // Get team messages ordered chronologically
    List<MessageEntity> findByMessageTypeAndTeamIdOrderByCreatedAtAsc(
            MessageType messageType,
            Long teamId
    );

    @Modifying
    @Transactional
    @Query("DELETE FROM MessageEntity m WHERE m.team.id = :teamId")
    void deleteByTeamId(@Param("teamId") Long teamId);
}