package com.testverse.controller;

import com.testverse.model.NotificationEntity;
import com.testverse.model.TeamEntity;
import com.testverse.model.UserEntity;
import com.testverse.model.UserRole;
import com.testverse.repository.NotificationRepository;
import com.testverse.repository.TeamRepository;
import com.testverse.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TeamRepository teamRepository;


    // ============================================================
    // SEND TEAM INVITATION
    // ============================================================

    @PostMapping("/invite")
    public ResponseEntity<?> sendInvitation(
            @RequestBody Map<String, Object> request,
            Authentication auth) {

        try {

            UserEntity admin =
                    userRepository
                            .findByUsername(auth.getName())
                            .orElse(null);

            if (admin == null ||
                    admin.getRole() != UserRole.ADMIN) {

                return ResponseEntity
                        .status(403)
                        .body(Map.of(
                                "error",
                                "Only Admin can send invitations"
                        ));
            }

            String userId =
                    String.valueOf(request.get("userId"));

            Long teamId =
                    ((Number) request.get("teamId")).longValue();


            UserEntity user =
                    userRepository
                            .findById(userId)
                            .orElse(null);

            if (user == null) {

                return ResponseEntity
                        .badRequest()
                        .body(Map.of(
                                "error",
                                "User not found"
                        ));
            }


            TeamEntity team =
                    teamRepository
                            .findById(teamId)
                            .orElse(null);

            if (team == null) {

                return ResponseEntity
                        .badRequest()
                        .body(Map.of(
                                "error",
                                "Team not found"
                        ));
            }


            // Check if already in team
            boolean alreadyInTeam =
                    team.getMembers()
                            .stream()
                            .anyMatch(
                                    member ->
                                            member.getId()
                                                    .equals(userId)
                            );

            if (alreadyInTeam) {

                return ResponseEntity
                        .badRequest()
                        .body(Map.of(
                                "error",
                                "User is already in the team"
                        ));
            }


            // Create notification
            NotificationEntity notification =
                    new NotificationEntity();

            notification.setTitle("Team Invitation");

            notification.setMessage(
                    admin.getName()
                            + " has invited you to join "
                            + team.getName()
            );

            notification.setUser(user);

            notification.setType("TEAM_INVITE");

            notification.setSenderId(admin.getId());

            notification.setTeamId(teamId);

            notification.setIsRead(false);

            notification.setIsAccepted(false);

            notification.setCreatedAt(
                    LocalDateTime.now()
            );

            notification.setUpdatedAt(
                    LocalDateTime.now()
            );

            notificationRepository.save(notification);


            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "Invitation sent successfully",

                            "userId",
                            userId,

                            "teamId",
                            teamId
                    )
            );

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "error",
                            e.getMessage()
                    ));
        }
    }


    // ============================================================
    // GET ALL NOTIFICATIONS FOR CURRENT USER
    // ============================================================

    @GetMapping
    public ResponseEntity<?> getNotifications(
            Authentication auth) {

        try {

            UserEntity user =
                    userRepository
                            .findByUsername(auth.getName())
                            .orElse(null);

            if (user == null) {

                return ResponseEntity
                        .status(401)
                        .body(Map.of(
                                "error",
                                "User not found"
                        ));
            }


            List<NotificationEntity> notifications =
                    notificationRepository
                            .findByUserIdOrderByCreatedAtDesc(
                                    user.getId()
                            );

            return ResponseEntity.ok(
                    notifications
            );

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "error",
                            e.getMessage()
                    ));
        }
    }


    // ============================================================
    // ACCEPT TEAM INVITATION
    // ============================================================

    @PostMapping("/{notificationId}/accept")
    public ResponseEntity<?> acceptInvitation(
            @PathVariable String notificationId,
            Authentication auth) {

        try {

            UserEntity user =
                    userRepository
                            .findByUsername(auth.getName())
                            .orElse(null);

            if (user == null) {

                return ResponseEntity
                        .status(401)
                        .body(Map.of(
                                "error",
                                "User not found"
                        ));
            }


            NotificationEntity notification =
                    notificationRepository
                            .findById(notificationId)
                            .orElse(null);

            if (notification == null) {

                return ResponseEntity
                        .notFound()
                        .build();
            }


            if (!notification
                    .getUser()
                    .getId()
                    .equals(user.getId())) {

                return ResponseEntity
                        .status(403)
                        .body(Map.of(
                                "error",
                                "Not your notification"
                        ));
            }


            TeamEntity team =
                    teamRepository
                            .findById(
                                    notification.getTeamId()
                            )
                            .orElse(null);

            if (team == null) {

                return ResponseEntity
                        .badRequest()
                        .body(Map.of(
                                "error",
                                "Team not found"
                        ));
            }


            // Add user to team
            team.getMembers().add(user);

            team.setUpdatedAt(
                    LocalDateTime.now()
            );

            teamRepository.save(team);


            notification.setIsAccepted(true);

            notification.setIsRead(true);

            notification.setUpdatedAt(
                    LocalDateTime.now()
            );

            notificationRepository.save(notification);


            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "You have joined the team successfully!",

                            "teamId",
                            team.getId(),

                            "teamName",
                            team.getName()
                    )
            );

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "error",
                            e.getMessage()
                    ));
        }
    }


    // ============================================================
    // REJECT TEAM INVITATION
    // ============================================================

    @PostMapping("/{notificationId}/reject")
    public ResponseEntity<?> rejectInvitation(
            @PathVariable String notificationId,
            Authentication auth) {

        try {

            UserEntity user =
                    userRepository
                            .findByUsername(auth.getName())
                            .orElse(null);

            if (user == null) {

                return ResponseEntity
                        .status(401)
                        .body(Map.of(
                                "error",
                                "User not found"
                        ));
            }


            NotificationEntity notification =
                    notificationRepository
                            .findById(notificationId)
                            .orElse(null);

            if (notification == null) {

                return ResponseEntity
                        .notFound()
                        .build();
            }


            if (!notification
                    .getUser()
                    .getId()
                    .equals(user.getId())) {

                return ResponseEntity
                        .status(403)
                        .body(Map.of(
                                "error",
                                "Not your notification"
                        ));
            }


            notification.setIsAccepted(false);

            notification.setIsRead(true);

            notification.setUpdatedAt(
                    LocalDateTime.now()
            );

            notificationRepository.save(notification);


            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "Invitation rejected"
                    )
            );

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "error",
                            e.getMessage()
                    ));
        }
    }


    // ============================================================
    // MARK NOTIFICATION AS READ
    // ============================================================

    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<?> markAsRead(
            @PathVariable String notificationId,
            Authentication auth) {

        try {

            UserEntity user =
                    userRepository
                            .findByUsername(auth.getName())
                            .orElse(null);

            if (user == null) {

                return ResponseEntity
                        .status(401)
                        .body(Map.of(
                                "error",
                                "User not found"
                        ));
            }


            NotificationEntity notification =
                    notificationRepository
                            .findById(notificationId)
                            .orElse(null);

            if (notification == null) {

                return ResponseEntity
                        .notFound()
                        .build();
            }


            if (!notification
                    .getUser()
                    .getId()
                    .equals(user.getId())) {

                return ResponseEntity
                        .status(403)
                        .body(Map.of(
                                "error",
                                "Not your notification"
                        ));
            }


            notification.setIsRead(true);

            notification.setUpdatedAt(
                    LocalDateTime.now()
            );

            notificationRepository.save(notification);


            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "Notification marked as read"
                    )
            );

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "error",
                            e.getMessage()
                    ));
        }
    }


    // ============================================================
    // DELETE NOTIFICATION
    // ============================================================

    @DeleteMapping("/{notificationId}")
    public ResponseEntity<?> deleteNotification(
            @PathVariable String notificationId,
            Authentication auth) {

        try {

            UserEntity user =
                    userRepository
                            .findByUsername(auth.getName())
                            .orElse(null);

            if (user == null) {

                return ResponseEntity
                        .status(401)
                        .body(Map.of(
                                "error",
                                "User not found"
                        ));
            }


            NotificationEntity notification =
                    notificationRepository
                            .findById(notificationId)
                            .orElse(null);

            if (notification == null) {

                return ResponseEntity
                        .notFound()
                        .build();
            }


            if (!notification
                    .getUser()
                    .getId()
                    .equals(user.getId())) {

                return ResponseEntity
                        .status(403)
                        .body(Map.of(
                                "error",
                                "Not your notification"
                        ));
            }


            notificationRepository.deleteById(
                    notificationId
            );


            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "Notification deleted"
                    )
            );

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "error",
                            e.getMessage()
                    ));
        }
    }
}