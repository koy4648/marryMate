package com.marrymate.backend.venue.domain;

import com.marrymate.backend.common.domain.BaseTimeEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "venues")
public class Venue extends BaseTimeEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 150)
    private String name;
    @Column(length = 500)
    private String address;
    protected Venue() {}
    private Venue(String name, String address) {
        if (name == null || name.isBlank()) throw new IllegalArgumentException("웨딩홀 이름은 필수입니다.");
        this.name = name.trim(); this.address = address == null ? null : address.trim();
    }
    public static Venue create(String name, String address) { return new Venue(name, address); }
    public Long getId() { return id; }
    public String getName() { return name; }
    public String getAddress() { return address; }
}
