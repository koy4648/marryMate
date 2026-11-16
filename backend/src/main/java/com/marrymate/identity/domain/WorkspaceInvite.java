package com.marrymate.identity.domain;

import java.time.Instant;
import jakarta.persistence.*;

@Entity
@Table(name = "workspace_invites")
public class WorkspaceInvite {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "workspace_id", nullable = false) private Long workspaceId;
    @Column(name = "created_by", nullable = false) private Long createdBy;
    @Column(name = "code_hash", nullable = false, unique = true, columnDefinition = "char(64)") private String codeHash;
    @Column(name = "expires_at", nullable = false) private Instant expiresAt;
    @Column(name = "used_at") private Instant usedAt;
    @Column(name = "created_at", nullable = false) private Instant createdAt;

    protected WorkspaceInvite() {}
    public WorkspaceInvite(Long workspaceId, Long createdBy, String codeHash) { this.workspaceId = workspaceId; this.createdBy = createdBy; this.codeHash = codeHash; this.createdAt = Instant.now(); this.expiresAt = this.createdAt.plusSeconds(60L * 60 * 24 * 7); }
    public Long getWorkspaceId() { return workspaceId; }
    public Instant getExpiresAt() { return expiresAt; }
    public boolean isUsable() { return usedAt == null && expiresAt.isAfter(Instant.now()); }
    public void use() { this.usedAt = Instant.now(); }
}

