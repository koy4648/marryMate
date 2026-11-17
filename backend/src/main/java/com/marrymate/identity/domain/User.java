package com.marrymate.identity.domain;

import java.time.Instant;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, unique = true) private String email;
    @Column(name = "password_hash", nullable = false) private String passwordHash;
    @Column(nullable = false, length = 80) private String nickname;
    @Column(nullable = false, length = 30) private String status;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;

    protected User() {}
    public User(String email, String passwordHash, String nickname) {
        this.email = email.trim().toLowerCase(); this.passwordHash = passwordHash; this.nickname = nickname.trim();
        this.status = "ACTIVE"; this.createdAt = Instant.now(); this.updatedAt = this.createdAt;
    }
    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public String getNickname() { return nickname; }
    public void rename(String nickname) { this.nickname = nickname.trim(); this.updatedAt = Instant.now(); }
}

