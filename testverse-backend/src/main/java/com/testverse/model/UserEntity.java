package com.testverse.model;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserEntity implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false, updatable = false)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(unique = true)
    private String username;

    @JsonIgnore
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    // Backward-compatible mapping for existing legacy database column
    @JsonIgnore
    @Column(name = "password", nullable = true)
    private String legacyPassword;

    @PrePersist
    @PreUpdate
    public void syncLegacyPassword() {
        if (this.passwordHash != null) {
            this.legacyPassword = this.passwordHash;
        }
    }

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    private UserRole role;

    @Enumerated(EnumType.STRING)
    private UserStatus status;

    // ============================================================
    // DEPARTMENT / DOMAIN
    // Specialization e.g. "Automation Testing", "Performance Testing",
    // or legacy "TESTING", "DEVELOPMENT"
    // ============================================================
    private String department;

    @Column(name = "can_mentor_developer")
    private Boolean canMentorDeveloper;

    @Column(name = "can_mentor_tester")
    private Boolean canMentorTester;

    public boolean canMentorDeveloper() {
        if (Boolean.TRUE.equals(canMentorDeveloper)) return true;
        if (canMentorDeveloper == null && "DEVELOPMENT".equalsIgnoreCase(department)) return true;
        return false;
    }

    public boolean canMentorTester() {
        if (Boolean.TRUE.equals(canMentorTester)) return true;
        if (canMentorTester == null && "TESTING".equalsIgnoreCase(department)) return true;
        return false;
    }

    // ============================================================
    // MENTOR
    // Points to another UserEntity whose role is MENTOR.
    // ============================================================
    @ManyToOne
    @JoinColumn(name = "mentor_id")
    private UserEntity mentor;

    // ============================================================
    // TEAM
    // ============================================================
    @ManyToOne
    @JoinColumn(name = "team_id")
    private TeamEntity team;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private LocalDateTime lastActiveAt;

    @Column(name = "last_general_read_id")
    private Long lastGeneralReadId;

    @JsonIgnore
    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(
                new SimpleGrantedAuthority(
                        "ROLE_" + (role != null ? role.name() : "USER")
                )
        );
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return status == UserStatus.ACTIVE;
    }
}