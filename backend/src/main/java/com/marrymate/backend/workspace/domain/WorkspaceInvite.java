package com.marrymate.backend.workspace.domain;

import com.marrymate.backend.user.domain.User;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "workspace_invites")
public class WorkspaceInvite {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workspace_id", nullable = false)
    private CoupleWorkspace workspace;
    @Column(name = "invite_code_hash", nullable = false, unique = true, length = 64, columnDefinition = "char(64)")
    private String inviteCodeHash;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private User createdBy;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "used_by_user_id")
    private User usedBy;
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;
    @Column(name = "used_at")
    private LocalDateTime usedAt;
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected WorkspaceInvite() {}
    private WorkspaceInvite(CoupleWorkspace workspace, String codeHash, User createdBy, LocalDateTime expiresAt) {
        this.workspace = workspace;
        this.inviteCodeHash = codeHash;
        this.createdBy = createdBy;
        this.expiresAt = expiresAt;
        this.createdAt = LocalDateTime.now();
    }
    public static WorkspaceInvite create(CoupleWorkspace workspace, String codeHash, User createdBy, LocalDateTime expiresAt) {
        return new WorkspaceInvite(workspace, codeHash, createdBy, expiresAt);
    }
    public boolean isUsable(LocalDateTime now) { return usedAt == null && expiresAt.isAfter(now); }
    public void use(User user, LocalDateTime now) { this.usedBy = user; this.usedAt = now; }
    public CoupleWorkspace getWorkspace() { return workspace; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
}
