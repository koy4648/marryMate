package com.marrymate.backend.auth.repository;

import com.marrymate.backend.auth.domain.AuthSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface AuthSessionRepository extends JpaRepository<AuthSession, Long> {
    @Query("select s from AuthSession s join fetch s.user where s.tokenHash = :hash and s.expiresAt > :now")
    Optional<AuthSession> findValid(@Param("hash") String hash, @Param("now") LocalDateTime now);
    void deleteByTokenHash(String tokenHash);
}
