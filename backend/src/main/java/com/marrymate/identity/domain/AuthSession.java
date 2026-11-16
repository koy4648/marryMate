package com.marrymate.identity.domain;

import java.time.Instant;
import jakarta.persistence.*;

@Entity
@Table(name = "auth_sessions")
public class AuthSession {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "user_id", nullable = false) private Long userId;
    @Column(name = "token_hash", nullable = false, unique = true, columnDefinition = "char(64)") private String tokenHash;
    @Column(name = "expires_at", nullable = false) private Instant expiresAt;
    @Column(name = "created_at", nullable = false) private Instant createdAt;

    protected AuthSession() {}
    public AuthSession(Long userId, String tokenHash) { this.userId = userId; this.tokenHash = tokenHash; this.createdAt = Instant.now(); this.expiresAt = this.createdAt.plusSeconds(60L * 60 * 24 * 30); }
    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public Instant getExpiresAt() { return expiresAt; }
}

