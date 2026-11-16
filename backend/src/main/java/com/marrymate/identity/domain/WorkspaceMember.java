package com.marrymate.identity.domain;

import java.time.Instant;
import jakarta.persistence.*;

@Entity
@Table(name = "workspace_members", uniqueConstraints = @UniqueConstraint(columnNames = {"workspace_id", "user_id"}))
public class WorkspaceMember {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "workspace_id", nullable = false) private Long workspaceId;
    @Column(name = "user_id", nullable = false) private Long userId;
    @Column(nullable = false, length = 30) private String role;
    @Column(name = "joined_at", nullable = false) private Instant joinedAt;

    protected WorkspaceMember() {}
    public WorkspaceMember(Long workspaceId, Long userId, String role) { this.workspaceId = workspaceId; this.userId = userId; this.role = role; this.joinedAt = Instant.now(); }
    public Long getWorkspaceId() { return workspaceId; }
    public Long getUserId() { return userId; }
    public String getRole() { return role; }
}

