package com.marrymate.identity.domain;

import java.time.Instant;
import jakarta.persistence.*;

@Entity
@Table(name = "couple_workspaces")
public class CoupleWorkspace {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, length = 120) private String name;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;

    protected CoupleWorkspace() {}
    public CoupleWorkspace(String name) { this.name = name; this.createdAt = Instant.now(); this.updatedAt = this.createdAt; }
    public Long getId() { return id; }
    public String getName() { return name; }
}

