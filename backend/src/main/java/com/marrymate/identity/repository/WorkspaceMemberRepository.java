package com.marrymate.identity.repository;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
import com.marrymate.identity.domain.WorkspaceMember;
public interface WorkspaceMemberRepository extends JpaRepository<WorkspaceMember, Long> { boolean existsByWorkspaceIdAndUserId(Long workspaceId, Long userId); Optional<WorkspaceMember> findByWorkspaceIdAndUserId(Long workspaceId, Long userId); List<WorkspaceMember> findAllByUserId(Long userId); }

