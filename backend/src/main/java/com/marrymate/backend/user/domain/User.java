package com.marrymate.backend.user.domain;

import com.marrymate.backend.common.domain.BaseTimeEntity;
import jakarta.persistence.*;

import java.util.Locale;

@Entity
@Table(name = "users")
public class User extends BaseTimeEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 255)
    private String email;
    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;
    @Column(nullable = false, length = 50)
    private String nickname;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private UserStatus status;

    protected User() {}

    private User(String email, String passwordHash, String nickname) {
        this.email = require(email, "이메일").toLowerCase(Locale.ROOT);
        this.passwordHash = require(passwordHash, "비밀번호");
        this.nickname = require(nickname, "닉네임");
        this.status = UserStatus.ACTIVE;
    }

    public static User create(String email, String passwordHash, String nickname) {
        return new User(email, passwordHash, nickname);
    }

    private static String require(String value, String name) {
        if (value == null || value.isBlank()) throw new IllegalArgumentException(name + "은(는) 필수입니다.");
        return value.trim();
    }

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public String getNickname() { return nickname; }
    public UserStatus getStatus() { return status; }
}
