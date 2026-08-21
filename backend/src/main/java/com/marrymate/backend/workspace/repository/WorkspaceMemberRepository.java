package com.marrymate.backend.workspace.repository;

import com.marrymate.backend.workspace.domain.WorkspaceMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface WorkspaceMemberRepository extends JpaRepository<WorkspaceMember, Long> {
    boolean existsByWorkspaceIdAndUserId(Long workspaceId, Long userId);
    @Query("select m from WorkspaceMember m join fetch m.workspace where m.user.id = :userId order by m.joinedAt")
    List<WorkspaceMember> findAllWithWorkspaceByUserId(@Param("userId") Long userId);
    @Query("select m from WorkspaceMember m join fetch m.user where m.workspace.id = :workspaceId and m.user.id = :userId")
    Optional<WorkspaceMember> findMembership(@Param("workspaceId") Long workspaceId, @Param("userId") Long userId);
}
