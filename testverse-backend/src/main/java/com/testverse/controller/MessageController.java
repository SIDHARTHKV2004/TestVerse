package com.testverse.controller;

import com.testverse.model.MessageEntity;
import com.testverse.model.UserEntity;
import com.testverse.model.UserRole;
import com.testverse.repository.MessageRepository;
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

    // ============ GET ALL MESSAGES FOR USER ============
    @GetMapping
    public ResponseEntity<?> getMessagesForUser() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();

            UserEntity user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            List<MessageEntity> messages;

            if (user.getRole() == UserRole.ADMIN) {
                // Admin sees ALL messages
                messages = messageRepository.findAllByOrderByCreatedAtDesc();
            } else {
                // Developer/Tester sees their team messages + broadcasts
                Long teamId = user.getTeam() != null ? user.getTeam().getId() : null;
                messages = messageRepository.findByTeamIdOrIsBroadcastOrderByCreatedAtDesc(teamId, true);
            }

            return ResponseEntity.ok(messages);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to fetch messages: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // ============ GET MESSAGES BY TEAM ============
    @GetMapping("/team/{teamId}")
    public ResponseEntity<?> getMessagesByTeam(@PathVariable Long teamId) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();

            UserEntity user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Check if user is authorized to view this team's messages
            if (user.getRole() != UserRole.ADMIN) {
                Long userTeamId = user.getTeam() != null ? user.getTeam().getId() : null;
                if (userTeamId == null || !userTeamId.equals(teamId)) {
                    Map<String, String> error = new HashMap<>();
                    error.put("error", "You are not authorized to view messages from this team");
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
                }
            }

            List<MessageEntity> messages = messageRepository.findByTeamIdOrderByCreatedAtDesc(teamId);
            return ResponseEntity.ok(messages);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to fetch team messages: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // ============ SEND MESSAGE ============
    @PostMapping
    public ResponseEntity<?> sendMessage(@RequestBody Map<String, Object> request) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();

            UserEntity sender = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String content = (String) request.get("content");
            Long teamId = request.get("teamId") != null ? ((Number) request.get("teamId")).longValue() : null;
            Boolean isBroadcast = request.get("isBroadcast") != null && (Boolean) request.get("isBroadcast");

            // Validate content
            if (content == null || content.trim().isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Message content is required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            // Only Admin can send broadcast
            if (isBroadcast && sender.getRole() != UserRole.ADMIN) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Only Admin can send broadcast messages");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
            }

            // If not broadcast, teamId is required
            if (!isBroadcast && teamId == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Team ID is required for non-broadcast messages");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            // Create message
            MessageEntity message = new MessageEntity();
            message.setContent(content);
            message.setSender(sender);
            message.setIsBroadcast(isBroadcast);
            message.setCreatedAt(LocalDateTime.now());

            // Set team if not broadcast
            if (!isBroadcast && teamId != null) {
                teamRepository.findById(teamId).ifPresent(message::setTeam);
            }

            MessageEntity savedMessage = messageRepository.save(message);

            // Return with sender info
            Map<String, Object> response = new HashMap<>();
            response.put("id", savedMessage.getId());
            response.put("content", savedMessage.getContent());
            response.put("senderId", savedMessage.getSender().getId());
            response.put("senderName", savedMessage.getSender().getName());
            response.put("senderRole", savedMessage.getSender().getRole());
            response.put("teamId", savedMessage.getTeam() != null ? savedMessage.getTeam().getId() : null);
            response.put("teamName", savedMessage.getTeam() != null ? savedMessage.getTeam().getName() : null);
            response.put("isBroadcast", savedMessage.getIsBroadcast());
            response.put("createdAt", savedMessage.getCreatedAt());

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to send message: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // ============ DELETE MESSAGE ============
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMessage(@PathVariable Long id) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();

            UserEntity user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            MessageEntity message = messageRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Message not found"));

            // Only Admin or the sender can delete
            if (user.getRole() != UserRole.ADMIN && !message.getSender().getId().equals(user.getId())) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "You are not authorized to delete this message");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
            }

            messageRepository.deleteById(id);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Message deleted successfully");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to delete message: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}
