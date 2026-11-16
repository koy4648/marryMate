package com.marrymate.identity.repository;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.marrymate.identity.domain.AuthSession;
public interface AuthSessionRepository extends JpaRepository<AuthSession, Long> { Optional<AuthSession> findByTokenHash(String tokenHash); void deleteByTokenHash(String tokenHash); }

