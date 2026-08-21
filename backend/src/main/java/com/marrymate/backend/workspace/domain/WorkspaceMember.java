package com.marrymate.backend.workspace.domain;

import com.marrymate.backend.user.domain.User;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "workspace_members", uniqueConstraints = @UniqueConstraint(columnNames = {"workspace_id", "user_id"}))
public class WorkspaceMember {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workspace_id", nullable = false)
    private CoupleWorkspace workspace;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private WorkspaceRole role;
    @Column(name = "joined_at", nullable = false)
    private LocalDateTime joinedAt;

    protected WorkspaceMember() {}
    private WorkspaceMember(CoupleWorkspace workspace, User user, WorkspaceRole role) {
        this.workspace = workspace;
        this.user = user;
        this.role = role;
        this.joinedAt = LocalDateTime.now();
    }
    public static WorkspaceMember create(CoupleWorkspace workspace, User user, WorkspaceRole role) {
        return new WorkspaceMember(workspace, user, role);
    }
    public CoupleWorkspace getWorkspace() { return workspace; }
    public User getUser() { return user; }
    public WorkspaceRole getRole() { return role; }
}
