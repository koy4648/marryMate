package com.marrymate.backend.workspace.repository;

import com.marrymate.backend.workspace.domain.WorkspaceInvite;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.util.Optional;

public interface WorkspaceInviteRepository extends JpaRepository<WorkspaceInvite, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<WorkspaceInvite> findByInviteCodeHash(String inviteCodeHash);
}
