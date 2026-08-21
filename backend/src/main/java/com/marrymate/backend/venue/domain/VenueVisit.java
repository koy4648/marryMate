package com.marrymate.backend.venue.domain;

import com.fasterxml.jackson.databind.JsonNode;
import com.marrymate.backend.common.domain.BaseTimeEntity;
import com.marrymate.backend.user.domain.User;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "venue_visits")
public class VenueVisit extends BaseTimeEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "venue_plan_id", nullable = false)
    private VenuePlan venuePlan;
    @Column(name = "visit_type", nullable = false, length = 30)
    private String visitType;
    @Column(name = "visit_date", nullable = false)
    private LocalDate visitDate;
    @Column(name = "visit_time", nullable = false)
    private LocalTime visitTime;
    @JdbcTypeCode(SqlTypes.JSON) @Column(nullable = false, columnDefinition = "json")
    private JsonNode payload;
    @Column(nullable = false)
    private boolean completed;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "last_modified_by", nullable = false)
    private User lastModifiedBy;
    @Version @Column(nullable = false)
    private long version;
    protected VenueVisit() {}
    private VenueVisit(VenuePlan plan, JsonNode payload, User user) {
        this.venuePlan = plan; this.createdBy = user; update(payload, user);
    }
    public static VenueVisit create(VenuePlan plan, JsonNode payload, User user) { return new VenueVisit(plan, payload, user); }
    public void update(JsonNode payload, User user) {
        this.payload = payload.deepCopy();
        this.visitType = text(payload, "visitType", "SECRET_TOUR");
        this.visitDate = LocalDate.parse(text(payload, "visitDate", LocalDate.now().toString()));
        this.visitTime = LocalTime.parse(text(payload, "visitTime", "00:00"));
        this.completed = payload.path("completed").asBoolean(false);
        this.lastModifiedBy = user;
    }
    private static String text(JsonNode node, String name, String fallback) {
        String value = node.path(name).asText(); return value.isBlank() ? fallback : value;
    }
    public Long getId() { return id; }
    public VenuePlan getVenuePlan() { return venuePlan; }
    public JsonNode getPayload() { return payload; }
}
