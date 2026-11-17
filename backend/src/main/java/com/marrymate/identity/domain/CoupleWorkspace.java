package com.marrymate.identity.domain;

import java.time.Instant;
import java.time.LocalDate;
import jakarta.persistence.*;

@Entity
@Table(name = "couple_workspaces")
public class CoupleWorkspace {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, length = 120) private String name;
    @Column(name = "wedding_date") private LocalDate weddingDate;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;

    protected CoupleWorkspace() {}
    public CoupleWorkspace(String name) { this(name,null); }
    public CoupleWorkspace(String name,LocalDate weddingDate) { this.name = name; this.weddingDate=weddingDate; this.createdAt = Instant.now(); this.updatedAt = this.createdAt; }
    public Long getId() { return id; }
    public String getName() { return name; }
    public LocalDate getWeddingDate() { return weddingDate; }
    public void update(String name,LocalDate weddingDate) { this.name = name.trim(); this.weddingDate=weddingDate; this.updatedAt = Instant.now(); }
}

