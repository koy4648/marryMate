package com.marrymate.identity.repository;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.marrymate.identity.domain.User;
public interface UserRepository extends JpaRepository<User, Long> { Optional<User> findByEmail(String email); boolean existsByEmail(String email); }

