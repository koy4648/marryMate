package com.marrymate.backend.workspace.domain;

import com.marrymate.backend.common.domain.BaseTimeEntity;
import com.marrymate.backend.user.domain.User;
import jakarta.persistence.*;

@Entity
@Table(name = "couple_workspaces")
public class CoupleWorkspace extends BaseTimeEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 100)
    private String name;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private User createdBy;

    protected CoupleWorkspace() {}
    private CoupleWorkspace(String name, User createdBy) {
        if (name == null || name.isBlank()) throw new IllegalArgumentException("워크스페이스 이름은 필수입니다.");
        this.name = name.trim();
        this.createdBy = createdBy;
    }
    public static CoupleWorkspace create(String name, User createdBy) { return new CoupleWorkspace(name, createdBy); }
    public Long getId() { return id; }
    public String getName() { return name; }
}
