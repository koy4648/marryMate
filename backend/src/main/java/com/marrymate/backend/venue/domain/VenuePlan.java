package com.marrymate.backend.venue.domain;

import com.marrymate.backend.common.domain.BaseTimeEntity;
import com.marrymate.backend.workspace.domain.CoupleWorkspace;
import jakarta.persistence.*;

@Entity
@Table(name = "venue_plans")
public class VenuePlan extends BaseTimeEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workspace_id", nullable = false)
    private CoupleWorkspace workspace;
    @ManyToOne(fetch = FetchType.LAZY, optional = false, cascade = CascadeType.PERSIST)
    @JoinColumn(name = "venue_id", nullable = false)
    private Venue venue;
    @Enumerated(EnumType.STRING) @Column(name = "candidate_status", nullable = false, length = 30)
    private CandidateStatus candidateStatus;
    @Column(name = "private_memo", columnDefinition = "TEXT")
    private String privateMemo;
    protected VenuePlan() {}
    private VenuePlan(CoupleWorkspace workspace, Venue venue, CandidateStatus status) {
        this.workspace = workspace; this.venue = venue; this.candidateStatus = status;
    }
    public static VenuePlan create(CoupleWorkspace workspace, Venue venue, CandidateStatus status) {
        return new VenuePlan(workspace, venue, status);
    }
    public void changeStatus(CandidateStatus status) { this.candidateStatus = status; }
    public Long getId() { return id; }
    public CoupleWorkspace getWorkspace() { return workspace; }
    public Venue getVenue() { return venue; }
    public CandidateStatus getCandidateStatus() { return candidateStatus; }
}
