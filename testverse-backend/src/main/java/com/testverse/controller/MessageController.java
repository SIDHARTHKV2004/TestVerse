package com.testverse.controller;

import com.testverse.model.MessageEntity;
import com.testverse.model.MessageType;
import com.testverse.model.NotificationEntity;
import com.testverse.model.UserEntity;
import com.testverse.model.UserRole;
import com.testverse.repository.MessageRepository;
import com.testverse.repository.NotificationRepository;
import com.testverse.repository.UserRepository;
import com.testverse.repository.TeamRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private NotificationRepository notificationRepository;


    // ============================================================
    // GET GENERAL MESSAGES
    // ============================================================

    @GetMapping("/general")
    public ResponseEntity<?> getGeneralMessages() {

        try {

            Authentication auth =
                    SecurityContextHolder
                            .getContext()
                            .getAuthentication();

            if (auth == null || !auth.isAuthenticated()) {

                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body("Authentication is required");
            }

            List<MessageEntity> messages =
                    messageRepository
                            .findByMessageTypeOrderByCreatedAtAsc(
                                    MessageType.GENERAL
                            );

            return ResponseEntity.ok(messages);

        } catch (Exception e) {

            Map<String, String> error =
                    new HashMap<>();

            error.put(
                    "error",
                    "Failed to fetch General messages: "
                            + e.getMessage()
            );

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(error);
        }
    }


    // ============================================================
    // GET DIRECT MESSAGES
    // ============================================================

    @GetMapping("/direct/{userId}")
    public ResponseEntity<?> getDirectMessages(
            @PathVariable String userId
    ) {

        try {

            Authentication auth =
                    SecurityContextHolder
                            .getContext()
                            .getAuthentication();

            String username = auth.getName();

            UserEntity currentUser =
                    userRepository
                            .findByUsername(username)
                            .orElseThrow(
                                    () -> new RuntimeException(
                                            "User not found"
                                    )
                            );

            UserEntity otherUser =
                    userRepository
                            .findById(userId)
                            .orElseThrow(
                                    () -> new RuntimeException(
                                            "User not found"
                                    )
                            );

            List<MessageEntity> messages =
                    messageRepository
                            .findByMessageTypeAndSenderIdAndReceiverIdOrMessageTypeAndSenderIdAndReceiverIdOrderByCreatedAtAsc(
                                    MessageType.DIRECT,
                                    currentUser.getId(),
                                    otherUser.getId(),

                                    MessageType.DIRECT,
                                    otherUser.getId(),
                                    currentUser.getId()
                            );

            return ResponseEntity.ok(messages);

        } catch (Exception e) {

            Map<String, String> error =
                    new HashMap<>();

            error.put(
                    "error",
                    "Failed to fetch direct messages: "
                            + e.getMessage()
            );

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(error);
        }
    }


    // ============================================================
    // GET USERS AVAILABLE FOR CHAT
    // ============================================================

    @GetMapping("/users")
    public ResponseEntity<?> getChatUsers() {

        try {

            Authentication auth =
                    SecurityContextHolder
                            .getContext()
                            .getAuthentication();

            String username = auth.getName();

            UserEntity currentUser =
                    userRepository
                            .findByUsername(username)
                            .orElseThrow(
                                    () -> new RuntimeException(
                                            "User not found"
                                    )
                            );

            List<UserEntity> users =
                    userRepository
                            .findAll()
                            .stream()

                            .filter(user ->
                                    user.getId() != null &&
                                            !user.getId()
                                                    .equals(currentUser.getId())
                            )

                            .filter(user ->
                                    user.getStatus() != null &&
                                            user.getStatus()
                                                    .name()
                                                    .equals("ACTIVE")
                            )

                            .toList();

            List<Map<String, Object>> result =
                    users.stream()
                            .map(user -> {

                                Map<String, Object> item =
                                        new HashMap<>();

                                item.put(
                                        "id",
                                        user.getId()
                                );

                                item.put(
                                        "name",
                                        user.getName()
                                );

                                item.put(
                                        "username",
                                        user.getUsername()
                                );

                                item.put(
                                        "email",
                                        user.getEmail()
                                );

                                item.put(
                                        "role",
                                        user.getRole()
                                );

                                return item;
                            })
                            .toList();

            return ResponseEntity.ok(result);

        } catch (Exception e) {

            Map<String, String> error =
                    new HashMap<>();

            error.put(
                    "error",
                    "Failed to fetch chat users: "
                            + e.getMessage()
            );

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(error);
        }
    }


    // ============================================================
    // SEND MESSAGE
    // ============================================================

    @PostMapping
    public ResponseEntity<?> sendMessage(
            @RequestBody Map<String, Object> request
    ) {

        try {

            Authentication auth =
                    SecurityContextHolder
                            .getContext()
                            .getAuthentication();

            String username = auth.getName();

            UserEntity sender =
                    userRepository
                            .findByUsername(username)
                            .orElseThrow(
                                    () -> new RuntimeException(
                                            "User not found"
                                    )
                            );


            // ----------------------------------------------------
            // MESSAGE CONTENT
            // ----------------------------------------------------

            String content =
                    request.get("content") != null
                            ? request
                            .get("content")
                            .toString()
                            : null;


            // ----------------------------------------------------
            // MESSAGE TYPE
            // ----------------------------------------------------

            String messageTypeValue =
                    request.get("messageType") != null
                            ? request
                            .get("messageType")
                            .toString()
                            : "GENERAL";


            if (
                    content == null ||
                            content.trim().isEmpty()
            ) {

                Map<String, String> error =
                        new HashMap<>();

                error.put(
                        "error",
                        "Message content is required"
                );

                return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body(error);
            }


            MessageType messageType;

            try {

                messageType =
                        MessageType.valueOf(
                                messageTypeValue
                                        .toUpperCase()
                        );

            } catch (IllegalArgumentException e) {

                Map<String, String> error =
                        new HashMap<>();

                error.put(
                        "error",
                        "Invalid message type"
                );

                return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body(error);
            }


            // ----------------------------------------------------
            // CREATE MESSAGE
            // ----------------------------------------------------

            MessageEntity message =
                    new MessageEntity();

            message.setContent(
                    content.trim()
            );

            message.setSender(sender);

            message.setMessageType(
                    messageType
            );

            message.setCreatedAt(
                    LocalDateTime.now()
            );

            message.setUpdatedAt(
                    LocalDateTime.now()
            );

            // New chat system does not use teams
            message.setTeam(null);

            message.setIsBroadcast(false);


            // ----------------------------------------------------
            // DIRECT MESSAGE
            // ----------------------------------------------------

            if (
                    messageType ==
                            MessageType.DIRECT
            ) {

                Object receiverIdObject =
                        request.get("receiverId");


                if (receiverIdObject == null) {

                    Map<String, String> error =
                            new HashMap<>();

                    error.put(
                            "error",
                            "receiverId is required for direct messages"
                    );

                    return ResponseEntity
                            .status(HttpStatus.BAD_REQUEST)
                            .body(error);
                }


                String receiverId =
                        receiverIdObject
                                .toString();


                UserEntity receiver =
                        userRepository
                                .findById(receiverId)
                                .orElse(null);


                if (receiver == null) {

                    Map<String, String> error =
                            new HashMap<>();

                    error.put(
                            "error",
                            "Receiver not found"
                    );

                    return ResponseEntity
                            .status(HttpStatus.NOT_FOUND)
                            .body(error);
                }


                // Prevent sending message to yourself
                if (
                        receiver
                                .getId()
                                .equals(sender.getId())
                ) {

                    Map<String, String> error =
                            new HashMap<>();

                    error.put(
                            "error",
                            "You cannot send a direct message to yourself"
                    );

                    return ResponseEntity
                            .status(HttpStatus.BAD_REQUEST)
                            .body(error);
                }


                // Only ACTIVE users can receive messages
                if (
                        receiver.getStatus() == null ||
                                !receiver
                                        .getStatus()
                                        .name()
                                        .equals("ACTIVE")
                ) {

                    Map<String, String> error =
                            new HashMap<>();

                    error.put(
                            "error",
                            "You cannot message an inactive user"
                    );

                    return ResponseEntity
                            .status(HttpStatus.BAD_REQUEST)
                            .body(error);
                }


                message.setReceiver(receiver);
            }


            // ----------------------------------------------------
            // GENERAL MESSAGE
            // ----------------------------------------------------

            if (
                    messageType ==
                            MessageType.GENERAL
            ) {

                message.setReceiver(null);
            }


            // ----------------------------------------------------
            // SAVE MESSAGE
            // ----------------------------------------------------

            MessageEntity savedMessage =
                    messageRepository.save(
                            message
                    );


            // ====================================================
            // CREATE NOTIFICATION FOR DIRECT MESSAGE
            // ====================================================

            if (
                    messageType ==
                            MessageType.DIRECT &&
                            savedMessage.getReceiver() != null
            ) {

                NotificationEntity notification =
                        NotificationEntity
                                .builder()

                                .title(
                                        "New Message"
                                )

                                .message(
                                        sender.getName() +
                                                " sent you a message: " +
                                                content
                                )

                                .user(
                                        savedMessage
                                                .getReceiver()
                                )

                                .type(
                                        "MESSAGE"
                                )

                                .isRead(false)

                                .isAccepted(false)

                                .senderId(
                                        sender.getId()
                                )

                                .teamId(null)

                                .createdAt(
                                        LocalDateTime.now()
                                )

                                .updatedAt(
                                        LocalDateTime.now()
                                )

                                .build();


                notificationRepository.save(
                        notification
                );
            }


            // ----------------------------------------------------
            // RESPONSE
            // ----------------------------------------------------

            Map<String, Object> response =
                    new HashMap<>();

            response.put(
                    "id",
                    savedMessage.getId()
            );

            response.put(
                    "content",
                    savedMessage.getContent()
            );

            response.put(
                    "senderId",
                    savedMessage
                            .getSender()
                            .getId()
            );

            response.put(
                    "senderName",
                    savedMessage
                            .getSender()
                            .getName()
            );

            response.put(
                    "senderRole",
                    savedMessage
                            .getSender()
                            .getRole()
            );

            response.put(
                    "receiverId",
                    savedMessage.getReceiver() != null
                            ? savedMessage
                            .getReceiver()
                            .getId()
                            : null
            );

            response.put(
                    "receiverName",
                    savedMessage.getReceiver() != null
                            ? savedMessage
                            .getReceiver()
                            .getName()
                            : null
            );

            response.put(
                    "messageType",
                    savedMessage.getMessageType()
            );

            response.put(
                    "createdAt",
                    savedMessage.getCreatedAt()
            );


            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(response);


        } catch (Exception e) {

            e.printStackTrace();

            Map<String, String> error =
                    new HashMap<>();

            error.put(
                    "error",
                    "Failed to send message: "
                            + e.getMessage()
            );

            return ResponseEntity
                    .status(
                            HttpStatus.INTERNAL_SERVER_ERROR
                    )
                    .body(error);
        }
    }
    // ============================================================
    // MARK DIRECT MESSAGES AS SEEN
    // ============================================================

    @PatchMapping("/direct/{userId}/seen")
    public ResponseEntity<?> markMessagesAsSeen(
            @PathVariable String userId
    ) {

        try {

            Authentication auth =
                    SecurityContextHolder
                            .getContext()
                            .getAuthentication();

            String username = auth.getName();

            UserEntity currentUser =
                    userRepository
                            .findByUsername(username)
                            .orElseThrow(
                                    () -> new RuntimeException(
                                            "User not found"
                                    )
                            );

            UserEntity otherUser =
                    userRepository
                            .findById(userId)
                            .orElseThrow(
                                    () -> new RuntimeException(
                                            "User not found"
                                    )
                            );

            List<MessageEntity> messages =
                    messageRepository
                            .findByMessageTypeAndSenderIdAndReceiverIdOrMessageTypeAndSenderIdAndReceiverIdOrderByCreatedAtAsc(
                                    MessageType.DIRECT,
                                    otherUser.getId(),
                                    currentUser.getId(),

                                    MessageType.DIRECT,
                                    currentUser.getId(),
                                    otherUser.getId()
                            );

            int updatedCount = 0;

            for (MessageEntity message : messages) {

                // Only mark messages FROM the other user as seen
                if (
                        message.getSender() != null &&
                                message.getSender()
                                        .getId()
                                        .equals(otherUser.getId()) &&

                                message.getReceiver() != null &&
                                message.getReceiver()
                                        .getId()
                                        .equals(currentUser.getId()) &&

                                !Boolean.TRUE.equals(
                                        message.getIsSeen()
                                )
                ) {

                    message.setIsSeen(true);

                    message.setUpdatedAt(
                            LocalDateTime.now()
                    );

                    messageRepository.save(message);

                    updatedCount++;
                }
            }

            Map<String, Object> response =
                    new HashMap<>();

            response.put(
                    "message",
                    "Messages marked as seen"
            );

            response.put(
                    "updatedCount",
                    updatedCount
            );

            return ResponseEntity.ok(response);

        } catch (Exception e) {

            e.printStackTrace();

            Map<String, String> error =
                    new HashMap<>();

            error.put(
                    "error",
                    "Failed to mark messages as seen: "
                            + e.getMessage()
            );

            return ResponseEntity
                    .status(
                            HttpStatus.INTERNAL_SERVER_ERROR
                    )
                    .body(error);
        }
    }




    // ============================================================
    // DELETE MESSAGE
    // ============================================================

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMessage(
            @PathVariable Long id
    ) {

        try {

            Authentication auth =
                    SecurityContextHolder
                            .getContext()
                            .getAuthentication();

            String username = auth.getName();

            UserEntity user =
                    userRepository
                            .findByUsername(username)
                            .orElseThrow(
                                    () -> new RuntimeException(
                                            "User not found"
                                    )
                            );

            MessageEntity message =
                    messageRepository
                            .findById(id)
                            .orElseThrow(
                                    () -> new RuntimeException(
                                            "Message not found"
                                    )
                            );


            boolean isSender =
                    message.getSender() != null &&
                            message
                                    .getSender()
                                    .getId()
                                    .equals(user.getId());


            boolean isAdmin =
                    user.getRole() ==
                            UserRole.ADMIN;


            if (
                    !isAdmin &&
                            !isSender
            ) {

                Map<String, String> error =
                        new HashMap<>();

                error.put(
                        "error",
                        "You are not authorized to delete this message"
                );

                return ResponseEntity
                        .status(HttpStatus.FORBIDDEN)
                        .body(error);
            }


            messageRepository.deleteById(id);


            Map<String, String> response =
                    new HashMap<>();

            response.put(
                    "message",
                    "Message deleted successfully"
            );

            return ResponseEntity.ok(
                    response
            );


        } catch (Exception e) {

            Map<String, String> error =
                    new HashMap<>();

            error.put(
                    "error",
                    "Failed to delete message: "
                            + e.getMessage()
            );

            return ResponseEntity
                    .status(
                            HttpStatus.INTERNAL_SERVER_ERROR
                    )
                    .body(error);
        }
    }


    // ============================================================
    // OLD TEAM MESSAGE ENDPOINT
    // KEPT TEMPORARILY FOR DATABASE/BACKWARD COMPATIBILITY
    // ============================================================

    @GetMapping("/team/{teamId}")
    public ResponseEntity<?> getMessagesByTeam(
            @PathVariable Long teamId
    ) {

        try {

            Authentication auth =
                    SecurityContextHolder
                            .getContext()
                            .getAuthentication();

            String username = auth.getName();

            UserEntity user =
                    userRepository
                            .findByUsername(username)
                            .orElseThrow(
                                    () -> new RuntimeException(
                                            "User not found"
                                    )
                            );


            if (
                    user.getRole() !=
                            UserRole.ADMIN
            ) {

                Long userTeamId =
                        user.getTeam() != null
                                ? user
                                .getTeam()
                                .getId()
                                : null;


                if (
                        userTeamId == null ||
                                !userTeamId.equals(teamId)
                ) {

                    Map<String, String> error =
                            new HashMap<>();

                    error.put(
                            "error",
                            "You are not authorized to view messages from this team"
                    );

                    return ResponseEntity
                            .status(
                                    HttpStatus.FORBIDDEN
                            )
                            .body(error);
                }
            }


            List<MessageEntity> messages =
                    messageRepository
                            .findByTeamIdOrderByCreatedAtDesc(
                                    teamId
                            );


            return ResponseEntity.ok(
                    messages
            );


        } catch (Exception e) {

            Map<String, String> error =
                    new HashMap<>();

            error.put(
                    "error",
                    "Failed to fetch team messages: "
                            + e.getMessage()
            );

            return ResponseEntity
                    .status(
                            HttpStatus.INTERNAL_SERVER_ERROR
                    )
                    .body(error);
        }
    }
    // ============================================================
// UPDATE USER LAST ACTIVE TIME
// ============================================================

    @PatchMapping("/heartbeat")
    public ResponseEntity<?> updateHeartbeat() {
        try {

            Authentication auth =
                    SecurityContextHolder.getContext().getAuthentication();

            String username = auth.getName();

            UserEntity user =
                    userRepository.findByUsername(username)
                            .orElseThrow(() ->
                                    new RuntimeException("User not found"));

            user.setLastActiveAt(LocalDateTime.now());

            userRepository.save(user);

            Map<String, Object> response = new HashMap<>();

            response.put("message", "Heartbeat updated");
            response.put("lastActiveAt", user.getLastActiveAt());

            return ResponseEntity.ok(response);

        } catch (Exception e) {

            e.printStackTrace();

            Map<String, String> error = new HashMap<>();

            error.put(
                    "error",
                    "Failed to update heartbeat: " + e.getMessage()
            );

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(error);
        }
    }
}