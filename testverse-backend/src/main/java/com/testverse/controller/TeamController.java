package com.testverse.controller;

import com.testverse.model.*;
import com.testverse.repository.MessageRepository;
import com.testverse.repository.TeamMembershipRepository;
import com.testverse.repository.TeamRepository;
import com.testverse.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/teams")
public class TeamController {

    private static final int MAX_TEAM_MEMBERSHIPS = 3;

    @Autowired private TeamRepository teamRepository;
    @Autowired private TeamMembershipRepository membershipRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private MessageRepository messageRepository;

    // ─────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────

    /** Resolve the authenticated UserEntity. Supports email-based principal. */
    private UserEntity resolveUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return null;
        Object principal = auth.getPrincipal();
        if (principal instanceof UserEntity) return (UserEntity) principal;
        String name = auth.getName();
        if (name == null || name.isBlank()) return null;
        return userRepository.findByEmail(name)
                .or(() -> userRepository.findByUsername(name))
                .orElse(null);
    }

    /** Serialize a team + its normalized memberships into a response map. */
    private Map<String, Object> serializeTeam(TeamEntity team, Long viewerUserId) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", team.getId());
        map.put("name", team.getName());
        map.put("description", team.getDescription() != null ? team.getDescription() : "");
        map.put("teamType", team.getTeamType() != null ? team.getTeamType().name() : TeamType.MIXED.name());
        map.put("createdAt", team.getCreatedAt());

        // Creator info (mentor or admin)
        if (team.getCreatedByMentor() != null) {
            Map<String, Object> creatorInfo = new HashMap<>();
            creatorInfo.put("id", team.getCreatedByMentor().getId());
            creatorInfo.put("name", team.getCreatedByMentor().getName());
            creatorInfo.put("role", "MENTOR");
            creatorInfo.put("department", team.getCreatedByMentor().getDepartment() != null ? team.getCreatedByMentor().getDepartment() : "");
            map.put("createdBy", creatorInfo);
        } else if (team.getAdmin() != null) {
            Map<String, Object> creatorInfo = new HashMap<>();
            creatorInfo.put("id", team.getAdmin().getId());
            creatorInfo.put("name", team.getAdmin().getName());
            creatorInfo.put("role", "ADMIN");
            creatorInfo.put("department", team.getAdmin().getDepartment() != null ? team.getAdmin().getDepartment() : "");
            map.put("createdBy", creatorInfo);
        }

        List<TeamMembershipEntity> memberships = membershipRepository.findByTeamId(team.getId());
        List<Map<String, Object>> membersList = new ArrayList<>();
        for (TeamMembershipEntity m : memberships) {
            UserEntity u = m.getUser();
            Map<String, Object> mMap = new HashMap<>();
            mMap.put("id", u.getId());
            mMap.put("name", u.getName());
            mMap.put("email", u.getEmail());
            mMap.put("username", u.getUsername());
            mMap.put("role", u.getRole() != null ? u.getRole().name() : "USER");
            mMap.put("department", u.getDepartment());
            mMap.put("joinedAt", m.getJoinedAt());
            membersList.add(mMap);
        }
        map.put("members", membersList);
        map.put("memberCount", membersList.size());
        map.put("isAdmin", team.getAdmin() != null && team.getAdmin().getId().equals(viewerUserId));
        map.put("isCreator",
                (team.getCreatedByMentor() != null && team.getCreatedByMentor().getId().equals(viewerUserId)) ||
                (team.getAdmin() != null && team.getAdmin().getId().equals(viewerUserId)));
        return map;
    }

    // ─────────────────────────────────────────────────────────────────
    // GET ALL TEAMS — Admin only
    // ─────────────────────────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<?> getAllTeams() {
        UserEntity user = resolveUser();
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        if (user.getRole() != UserRole.ADMIN) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Only Admin can view all teams"));

        List<Map<String, Object>> result = teamRepository.findAll()
                .stream().map(t -> serializeTeam(t, user.getId())).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // ─────────────────────────────────────────────────────────────────
    // CREATE TEAM — Admin or Mentor
    // ─────────────────────────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<?> createTeam(@RequestBody Map<String, Object> request) {
        UserEntity creator = resolveUser();
        if (creator == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));

        boolean isAdmin = creator.getRole() == UserRole.ADMIN;
        boolean isMentor = creator.getRole() == UserRole.MENTOR;
        if (!isAdmin && !isMentor) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Only Admin or Mentor can create teams"));
        }

        String name = request.get("name") != null ? request.get("name").toString().trim() : null;
        String description = request.getOrDefault("description", "").toString();

        if (name == null || name.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Team name is required"));
        }

        if (teamRepository.findByName(name).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Team name already exists"));
        }

        // Parse teamType (default MIXED)
        TeamType teamType = TeamType.MIXED;
        Object typeObj = request.get("teamType");
        if (typeObj != null) {
            try {
                teamType = TeamType.valueOf(typeObj.toString().trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Invalid teamType. Allowed: DEVELOPERS_ONLY, TESTERS_ONLY, MIXED"));
            }
        }

        TeamEntity team = TeamEntity.builder()
                .name(name)
                .description(description)
                .teamType(teamType)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        if (isAdmin) {
            team.setAdmin(creator);
        } else {
            team.setCreatedByMentor(creator);
        }

        TeamEntity savedTeam = teamRepository.save(team);

        // Auto-add creator as first member
        TeamMembershipEntity creatorMembership = TeamMembershipEntity.builder()
                .team(savedTeam)
                .user(creator)
                .joinedAt(LocalDateTime.now())
                .build();
        membershipRepository.save(creatorMembership);

        // Process optional initial member IDs if provided during team creation
        Object memberIdsObj = request.get("memberIds");
        if (memberIdsObj instanceof List<?>) {
            List<?> rawList = (List<?>) memberIdsObj;
            Set<Long> uniqueMemberIds = new LinkedHashSet<>();
            for (Object item : rawList) {
                if (item != null) {
                    try {
                        uniqueMemberIds.add(item instanceof Number ? ((Number) item).longValue() : Long.parseLong(item.toString()));
                    } catch (NumberFormatException ignored) {}
                }
            }

            for (Long memberId : uniqueMemberIds) {
                if (memberId.equals(creator.getId())) continue;

                UserEntity targetUser = userRepository.findById(memberId).orElse(null);
                if (targetUser == null || targetUser.getStatus() != UserStatus.ACTIVE) {
                    continue;
                }

                UserRole targetRole = targetUser.getRole();
                if (teamType == TeamType.DEVELOPERS_ONLY && targetRole != UserRole.DEVELOPER) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Map.of("error", "This is a Developers-only team. Only DEVELOPER users can be added."));
                }
                if (teamType == TeamType.TESTERS_ONLY && targetRole != UserRole.TESTER) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Map.of("error", "This is a Testers-only team. Only TESTER users can be added."));
                }
                if (teamType == TeamType.MIXED && targetRole != UserRole.DEVELOPER && targetRole != UserRole.TESTER) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Map.of("error", "This is a Mixed team. Only DEVELOPER and TESTER users can be added."));
                }

                if (isMentor) {
                    boolean isMentee = targetUser.getMentor() != null && targetUser.getMentor().getId().equals(creator.getId());
                    if (!isMentee) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body(Map.of("error", "You can only add users assigned to you as their mentor"));
                    }
                }

                long currentCount = membershipRepository.countByUserId(memberId);
                if (currentCount >= MAX_TEAM_MEMBERSHIPS) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Map.of("error", "User can belong to a maximum of 3 teams."));
                }

                if (!membershipRepository.existsByTeamIdAndUserId(savedTeam.getId(), memberId)) {
                    TeamMembershipEntity menteeMembership = TeamMembershipEntity.builder()
                            .team(savedTeam)
                            .user(targetUser)
                            .joinedAt(LocalDateTime.now())
                            .build();
                    membershipRepository.save(menteeMembership);
                }
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("id", savedTeam.getId());
        response.put("name", savedTeam.getName());
        response.put("description", savedTeam.getDescription());
        response.put("teamType", savedTeam.getTeamType().name());
        response.put("createdAt", savedTeam.getCreatedAt());
        response.put("message", "Team created successfully");
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ─────────────────────────────────────────────────────────────────
    // GET MY TEAMS — All roles
    // ─────────────────────────────────────────────────────────────────
    @GetMapping("/my-teams")
    public ResponseEntity<?> getMyTeams() {
        UserEntity user = resolveUser();
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));

        List<TeamMembershipEntity> memberships = membershipRepository.findByUserId(user.getId());
        List<Map<String, Object>> result = new ArrayList<>();
        for (TeamMembershipEntity m : memberships) {
            TeamEntity team = m.getTeam();
            Map<String, Object> td = new HashMap<>();
            td.put("id", team.getId());
            td.put("name", team.getName());
            td.put("description", team.getDescription() != null ? team.getDescription() : "");
            td.put("teamType", team.getTeamType() != null ? team.getTeamType().name() : TeamType.MIXED.name());
            td.put("memberCount", membershipRepository.findByTeamId(team.getId()).size());
            td.put("isCreator",
                    (team.getAdmin() != null && team.getAdmin().getId().equals(user.getId())) ||
                    (team.getCreatedByMentor() != null && team.getCreatedByMentor().getId().equals(user.getId())));
            if (team.getCreatedByMentor() != null) {
                td.put("createdBy", Map.of(
                        "id", team.getCreatedByMentor().getId(),
                        "name", team.getCreatedByMentor().getName(),
                        "role", "MENTOR",
                        "department", team.getCreatedByMentor().getDepartment() != null ? team.getCreatedByMentor().getDepartment() : ""
                ));
            } else if (team.getAdmin() != null) {
                td.put("createdBy", Map.of(
                        "id", team.getAdmin().getId(),
                        "name", team.getAdmin().getName(),
                        "role", "ADMIN",
                        "department", team.getAdmin().getDepartment() != null ? team.getAdmin().getDepartment() : ""
                ));
            }
            result.add(td);
        }

        // Also include teams I manage as mentor/admin but may not be a member of
        if (user.getRole() == UserRole.MENTOR) {
            List<TeamEntity> myCreated = teamRepository.findByCreatedByMentorId(user.getId());
            Set<Long> alreadyIncluded = result.stream()
                    .map(m -> ((Number) m.get("id")).longValue())
                    .collect(Collectors.toSet());
            for (TeamEntity team : myCreated) {
                if (!alreadyIncluded.contains(team.getId())) {
                    Map<String, Object> td = new HashMap<>();
                    td.put("id", team.getId());
                    td.put("name", team.getName());
                    td.put("description", team.getDescription() != null ? team.getDescription() : "");
                    td.put("teamType", team.getTeamType() != null ? team.getTeamType().name() : TeamType.MIXED.name());
                    td.put("memberCount", membershipRepository.findByTeamId(team.getId()).size());
                    td.put("isCreator", true);
                    if (team.getCreatedByMentor() != null) {
                        td.put("createdBy", Map.of(
                                "id", team.getCreatedByMentor().getId(),
                                "name", team.getCreatedByMentor().getName(),
                                "role", "MENTOR",
                                "department", team.getCreatedByMentor().getDepartment() != null ? team.getCreatedByMentor().getDepartment() : ""
                        ));
                    }
                    result.add(td);
                }
            }
        }

        return ResponseEntity.ok(result);
    }

    // ─────────────────────────────────────────────────────────────────
    // GET TEAM DETAIL — Any authenticated user (membership check for non-admin)
    // ─────────────────────────────────────────────────────────────────
    @GetMapping("/{teamId}")
    public ResponseEntity<?> getTeam(@PathVariable Long teamId) {
        UserEntity user = resolveUser();
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));

        TeamEntity team = teamRepository.findById(teamId).orElse(null);
        if (team == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Team not found"));

        // Admins can view any team; mentors can view teams they created; members can view their team
        boolean isAdmin = user.getRole() == UserRole.ADMIN;
        boolean isMentorCreator = team.getCreatedByMentor() != null && team.getCreatedByMentor().getId().equals(user.getId());
        boolean isMember = membershipRepository.existsByTeamIdAndUserId(teamId, user.getId());

        if (!isAdmin && !isMentorCreator && !isMember) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "You are not a member of this team"));
        }

        return ResponseEntity.ok(serializeTeam(team, user.getId()));
    }

    // ─────────────────────────────────────────────────────────────────
    // GET AVAILABLE TEAMS — Users who are not yet at max memberships
    // ─────────────────────────────────────────────────────────────────
    @GetMapping("/available")
    public ResponseEntity<?> getAvailableTeams() {
        UserEntity user = resolveUser();
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));

        long myCount = membershipRepository.countByUserId(user.getId());
        if (myCount >= MAX_TEAM_MEMBERSHIPS) {
            return ResponseEntity.ok(List.of()); // already at max
        }

        Set<Long> myTeamIds = membershipRepository.findByUserId(user.getId())
                .stream().map(m -> m.getTeam().getId()).collect(Collectors.toSet());

        List<Map<String, Object>> available = teamRepository.findAll().stream()
                .filter(t -> !myTeamIds.contains(t.getId()))
                .filter(t -> {
                    // Mentor-created teams are only available to mentees of that mentor
                    if (t.getCreatedByMentor() != null) {
                        return user.getMentor() != null && user.getMentor().getId().equals(t.getCreatedByMentor().getId());
                    }
                    return true;
                })
                .map(t -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", t.getId());
                    m.put("name", t.getName());
                    m.put("description", t.getDescription() != null ? t.getDescription() : "");
                    m.put("teamType", t.getTeamType() != null ? t.getTeamType().name() : TeamType.MIXED.name());
                    m.put("memberCount", membershipRepository.findByTeamId(t.getId()).size());
                    if (t.getCreatedByMentor() != null) {
                        m.put("createdBy", Map.of(
                                "id", t.getCreatedByMentor().getId(),
                                "name", t.getCreatedByMentor().getName(),
                                "role", "MENTOR",
                                "department", t.getCreatedByMentor().getDepartment() != null ? t.getCreatedByMentor().getDepartment() : ""
                        ));
                    }
                    return m;
                }).collect(Collectors.toList());

        return ResponseEntity.ok(available);
    }

    // ─────────────────────────────────────────────────────────────────
    // ADD MEMBER — Admin or the mentor who created the team
    // ─────────────────────────────────────────────────────────────────
    @PostMapping("/{teamId}/members")
    public ResponseEntity<?> addMember(@PathVariable Long teamId, @RequestBody Map<String, Object> request) {
        UserEntity actor = resolveUser();
        if (actor == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));

        TeamEntity team = teamRepository.findById(teamId).orElse(null);
        if (team == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Team not found"));

        boolean isAdmin = actor.getRole() == UserRole.ADMIN;
        boolean isMentorCreator = team.getCreatedByMentor() != null && team.getCreatedByMentor().getId().equals(actor.getId());
        if (!isAdmin && !isMentorCreator) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Only the team creator or Admin can add members"));
        }

        Object userIdVal = request.get("userId");
        if (userIdVal == null) return ResponseEntity.badRequest().body(Map.of("error", "userId is required"));
        Long userId;
        try {
            userId = userIdVal instanceof Number ? ((Number) userIdVal).longValue() : Long.parseLong(String.valueOf(userIdVal));
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid userId"));
        }

        UserEntity targetUser = userRepository.findById(userId).orElse(null);
        if (targetUser == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));

        // Team type validation
        TeamType teamType = team.getTeamType() != null ? team.getTeamType() : TeamType.MIXED;
        UserRole targetRole = targetUser.getRole();
        if (teamType == TeamType.DEVELOPERS_ONLY && targetRole != UserRole.DEVELOPER) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "This is a Developers-only team. Only DEVELOPER users can be added."));
        }
        if (teamType == TeamType.TESTERS_ONLY && targetRole != UserRole.TESTER) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "This is a Testers-only team. Only TESTER users can be added."));
        }
        if (teamType == TeamType.MIXED && targetRole != UserRole.DEVELOPER && targetRole != UserRole.TESTER) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "This is a Mixed team. Only DEVELOPER and TESTER users can be added."));
        }

        // Mentor authorization: can only add their own mentees (or admin bypasses)
        if (!isAdmin && isMentorCreator) {
            boolean isMentee = targetUser.getMentor() != null && targetUser.getMentor().getId().equals(actor.getId());
            if (!isMentee) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "You can only add users assigned to you as their mentor"));
            }
        }

        // Duplicate membership check
        if (membershipRepository.existsByTeamIdAndUserId(teamId, userId)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "User is already a member of this team"));
        }

        // Max-3 check
        long currentCount = membershipRepository.countByUserId(userId);
        if (currentCount >= MAX_TEAM_MEMBERSHIPS) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "User can belong to a maximum of 3 teams."));
        }

        TeamMembershipEntity membership = TeamMembershipEntity.builder()
                .team(team)
                .user(targetUser)
                .joinedAt(LocalDateTime.now())
                .build();
        membershipRepository.save(membership);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "User added to team successfully");
        response.put("teamId", team.getId());
        response.put("teamName", team.getName());
        response.put("userId", targetUser.getId());
        response.put("userName", targetUser.getName());
        response.put("userRole", targetUser.getRole());
        return ResponseEntity.ok(response);
    }

    // ─────────────────────────────────────────────────────────────────
    // REMOVE MEMBER — Admin or team's mentor creator
    // ─────────────────────────────────────────────────────────────────
    @DeleteMapping("/{teamId}/members/{userId}")
    public ResponseEntity<?> removeMember(@PathVariable Long teamId, @PathVariable Long userId) {
        UserEntity actor = resolveUser();
        if (actor == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));

        TeamEntity team = teamRepository.findById(teamId).orElse(null);
        if (team == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Team not found"));

        boolean isAdmin = actor.getRole() == UserRole.ADMIN;
        boolean isMentorCreator = team.getCreatedByMentor() != null && team.getCreatedByMentor().getId().equals(actor.getId());
        if (!isAdmin && !isMentorCreator) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Only the team creator or Admin can remove members"));
        }

        if (!membershipRepository.existsByTeamIdAndUserId(teamId, userId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User is not a member of this team"));
        }

        membershipRepository.deleteByTeamIdAndUserId(teamId, userId);
        return ResponseEntity.ok(Map.of("message", "User removed from team successfully"));
    }

    // ─────────────────────────────────────────────────────────────────
    // DELETE TEAM — Admin or the mentor who created the team
    // ─────────────────────────────────────────────────────────────────
    @DeleteMapping("/{teamId}")
    public ResponseEntity<?> deleteTeam(@PathVariable Long teamId) {
        UserEntity actor = resolveUser();
        if (actor == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));

        TeamEntity team = teamRepository.findById(teamId).orElse(null);
        if (team == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Team not found"));

        boolean isAdmin = actor.getRole() == UserRole.ADMIN;
        boolean isMentorCreator = team.getCreatedByMentor() != null && team.getCreatedByMentor().getId().equals(actor.getId());
        if (!isAdmin && !isMentorCreator) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Only the team creator or Admin can delete this team"));
        }

        // Delete team messages to maintain referential integrity
        messageRepository.deleteByTeamId(teamId);

        // Detach any legacy user pointers to this team
        if (team.getMembers() != null) {
            for (UserEntity member : team.getMembers()) {
                member.setTeam(null);
                userRepository.save(member);
            }
        }

        membershipRepository.deleteByTeamId(teamId);
        teamRepository.deleteById(teamId);
        return ResponseEntity.ok(Map.of("message", "Team deleted successfully"));
    }

    // ─────────────────────────────────────────────────────────────────
    // GET ADMIN-TEAM (legacy endpoint — preserved for backward compat)
    // ─────────────────────────────────────────────────────────────────
    @GetMapping("/admin-team")
    public ResponseEntity<?> getAdminTeam() {
        UserEntity user = resolveUser();
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        if (user.getRole() != UserRole.ADMIN) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Only Admin can access this"));

        List<TeamEntity> adminTeams = teamRepository.findByAdminId(user.getId());
        if (!adminTeams.isEmpty()) {
            return ResponseEntity.ok(serializeTeam(adminTeams.get(0), user.getId()));
        }

        List<TeamEntity> allTeams = teamRepository.findAll();
        if (!allTeams.isEmpty()) {
            return ResponseEntity.ok(serializeTeam(allTeams.get(0), user.getId()));
        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "No teams found. Create one first."));
    }

    // ─────────────────────────────────────────────────────────────────
    // REQUEST TO JOIN TEAM (self-join by dev/tester)
    // ─────────────────────────────────────────────────────────────────
    @PostMapping("/{teamId}/request-join")
    public ResponseEntity<?> requestJoin(@PathVariable Long teamId) {
        UserEntity user = resolveUser();
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));

        TeamEntity team = teamRepository.findById(teamId).orElse(null);
        if (team == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Team not found"));

        // Team type check
        TeamType teamType = team.getTeamType() != null ? team.getTeamType() : TeamType.MIXED;
        UserRole userRole = user.getRole();
        if (teamType == TeamType.DEVELOPERS_ONLY && userRole != UserRole.DEVELOPER) {
            return ResponseEntity.badRequest().body(Map.of("error", "This is a Developers-only team"));
        }
        if (teamType == TeamType.TESTERS_ONLY && userRole != UserRole.TESTER) {
            return ResponseEntity.badRequest().body(Map.of("error", "This is a Testers-only team"));
        }
        if (teamType == TeamType.MIXED && userRole != UserRole.DEVELOPER && userRole != UserRole.TESTER) {
            return ResponseEntity.badRequest().body(Map.of("error", "This is a Mixed team for Developers and Testers only"));
        }

        // Mentor-created team: only mentees of that mentor can join
        if (team.getCreatedByMentor() != null) {
            if (user.getMentor() == null || !user.getMentor().getId().equals(team.getCreatedByMentor().getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "You can only join teams created by your assigned mentor"));
            }
        }

        if (membershipRepository.existsByTeamIdAndUserId(teamId, user.getId())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "You are already in this team"));
        }

        long currentCount = membershipRepository.countByUserId(user.getId());
        if (currentCount >= MAX_TEAM_MEMBERSHIPS) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "User can belong to a maximum of 3 teams."));
        }

        TeamMembershipEntity membership = TeamMembershipEntity.builder()
                .team(team)
                .user(user)
                .joinedAt(LocalDateTime.now())
                .build();
        membershipRepository.save(membership);

        return ResponseEntity.ok(Map.of(
                "message", "You have successfully joined the team!",
                "teamId", team.getId(),
                "teamName", team.getName()
        ));
    }

    // ─────────────────────────────────────────────────────────────────
    // TEAM CHAT — GET messages (member or admin/mentor creator only)
    // ─────────────────────────────────────────────────────────────────
    @GetMapping("/{teamId}/messages")
    public ResponseEntity<?> getTeamMessages(@PathVariable Long teamId) {
        UserEntity user = resolveUser();
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));

        TeamEntity team = teamRepository.findById(teamId).orElse(null);
        if (team == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Team not found"));

        if (!isAuthorizedForTeamChat(user, team)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "You are not a member of this team"));
        }

        List<MessageEntity> messages = messageRepository
                .findByMessageTypeAndTeamIdOrderByCreatedAtAsc(MessageType.TEAM, teamId);

        List<Map<String, Object>> result = messages.stream().map(m -> {
            Map<String, Object> msg = new HashMap<>();
            msg.put("id", m.getId());
            msg.put("content", m.getContent());
            msg.put("createdAt", m.getCreatedAt());
            msg.put("messageType", "TEAM");
            if (m.getSender() != null) {
                msg.put("sender", Map.of(
                        "id", m.getSender().getId(),
                        "name", m.getSender().getName(),
                        "role", m.getSender().getRole() != null ? m.getSender().getRole().name() : "USER"
                ));
            }
            return msg;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    // ─────────────────────────────────────────────────────────────────
    // TEAM CHAT — POST message (member or admin/mentor creator only)
    // ─────────────────────────────────────────────────────────────────
    @PostMapping("/{teamId}/messages")
    public ResponseEntity<?> sendTeamMessage(@PathVariable Long teamId, @RequestBody Map<String, Object> request) {
        UserEntity sender = resolveUser();
        if (sender == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));

        TeamEntity team = teamRepository.findById(teamId).orElse(null);
        if (team == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Team not found"));

        if (!isAuthorizedForTeamChat(sender, team)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "You are not a member of this team"));
        }

        String content = request.get("content") != null ? request.get("content").toString().trim() : null;
        if (content == null || content.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Message content is required"));
        }

        MessageEntity message = MessageEntity.builder()
                .content(content)
                .sender(sender)
                .receiver(null)
                .messageType(MessageType.TEAM)
                .team(team)
                .isBroadcast(false)
                .isSeen(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        MessageEntity saved = messageRepository.save(message);

        Map<String, Object> response = new HashMap<>();
        response.put("id", saved.getId());
        response.put("content", saved.getContent());
        response.put("createdAt", saved.getCreatedAt());
        response.put("messageType", "TEAM");
        response.put("sender", Map.of("id", sender.getId(), "name", sender.getName()));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ─────────────────────────────────────────────────────────────────
    // GET MENTOR'S MENTEES — for mentor to pick from when creating team
    // ─────────────────────────────────────────────────────────────────
    @GetMapping("/mentor/eligible-members")
    public ResponseEntity<?> getEligibleMembers() {
        UserEntity mentor = resolveUser();
        if (mentor == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        if (mentor.getRole() != UserRole.MENTOR) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Only mentors can access this"));

        List<UserEntity> mentees = userRepository.findByMentorId(mentor.getId());
        List<Map<String, Object>> result = new ArrayList<>();
        for (UserEntity u : mentees) {
            if (u.getStatus() != UserStatus.ACTIVE) continue;
            long membershipCount = membershipRepository.countByUserId(u.getId());
            Map<String, Object> m = new HashMap<>();
            m.put("id", u.getId());
            m.put("name", u.getName());
            m.put("email", u.getEmail());
            m.put("username", u.getUsername());
            m.put("role", u.getRole() != null ? u.getRole().name() : "USER");
            m.put("department", u.getDepartment());
            m.put("currentTeamCount", membershipCount);
            m.put("atMaxTeams", membershipCount >= MAX_TEAM_MEMBERSHIPS);
            m.put("canJoin", membershipCount < MAX_TEAM_MEMBERSHIPS);
            result.add(m);
        }
        return ResponseEntity.ok(result);
    }

    // ─────────────────────────────────────────────────────────────────
    // PRIVATE: Authorization check for team chat
    // ─────────────────────────────────────────────────────────────────
    private boolean isAuthorizedForTeamChat(UserEntity user, TeamEntity team) {
        if (user.getRole() == UserRole.ADMIN) return true;
        if (team.getCreatedByMentor() != null && team.getCreatedByMentor().getId().equals(user.getId())) return true;
        if (team.getAdmin() != null && team.getAdmin().getId().equals(user.getId())) return true;
        return membershipRepository.existsByTeamIdAndUserId(team.getId(), user.getId());
    }
}