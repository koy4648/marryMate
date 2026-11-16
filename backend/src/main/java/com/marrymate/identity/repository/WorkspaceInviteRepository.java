package com.marrymate.identity.repository;
import java.util.Optional;
import org.springframework.data.jpa.repository.*;
import jakarta.persistence.LockModeType;
import com.marrymate.identity.domain.WorkspaceInvite;
public interface WorkspaceInviteRepository extends JpaRepository<WorkspaceInvite, Long> { @Lock(LockModeType.PESSIMISTIC_WRITE) Optional<WorkspaceInvite> findByCodeHash(String codeHash); }

