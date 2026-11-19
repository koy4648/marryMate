package com.marrymate.planning.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class GatheringAttendee {
    @Column(nullable=false,length=80) private String name;
    @Column(nullable=false,length=10) private String side;
    protected GatheringAttendee() {}
    public GatheringAttendee(String name,String side) { this.name=name.trim(); this.side=side; }
    public String getName() { return name; }
    public String getSide() { return side; }
}
