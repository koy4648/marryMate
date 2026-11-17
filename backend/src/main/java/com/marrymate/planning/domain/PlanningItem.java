package com.marrymate.planning.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import jakarta.persistence.*;

@Entity
@Table(name = "planning_items")
public class PlanningItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "workspace_id", nullable = false) private Long workspaceId;
    @Column(name = "service_group", nullable = false, length = 80) private String serviceGroup;
    @Column(name = "item_name", nullable = false, length = 120) private String itemName;
    @Column(name = "vendor_name", nullable = false, length = 160) private String vendorName;
    @Column(nullable = false, length = 30) private String status;
    @Column(name = "schedule_date") private LocalDate scheduleDate;
    @Column(name = "quoted_amount", nullable = false, precision = 15, scale = 0) private BigDecimal quotedAmount;
    @Column(name = "actual_amount", nullable = false, precision = 15, scale = 0) private BigDecimal actualAmount;
    private Integer rating;
    @Column(name = "review_type", nullable = false, length = 30) private String reviewType;
    @Column(nullable = false, columnDefinition = "TEXT") private String review;
    @Column(nullable = false, length = 1000) private String pros;
    @Column(nullable = false, length = 1000) private String cons;
    @Column(nullable = false, length = 1000) private String memo;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;

    protected PlanningItem() {}

    public PlanningItem(Long workspaceId, String serviceGroup, String itemName) {
        this.workspaceId = workspaceId;
        this.serviceGroup = serviceGroup;
        this.itemName = itemName;
        this.vendorName = "";
        this.status = "TODO";
        this.quotedAmount = BigDecimal.ZERO;
        this.actualAmount = BigDecimal.ZERO;
        this.reviewType = "NONE";
        this.review = "";
        this.pros = "";
        this.cons = "";
        this.memo = "";
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    public void change(String serviceGroup, String itemName, String vendorName, String status,
                       LocalDate scheduleDate, BigDecimal quotedAmount, BigDecimal actualAmount,
                       Integer rating, String reviewType, String review, String pros, String cons, String memo) {
        this.serviceGroup = serviceGroup;
        this.itemName = itemName;
        this.vendorName = value(vendorName);
        this.status = status;
        this.scheduleDate = scheduleDate;
        this.quotedAmount = quotedAmount == null ? BigDecimal.ZERO : quotedAmount;
        this.actualAmount = actualAmount == null ? BigDecimal.ZERO : actualAmount;
        this.rating = rating;
        this.reviewType = value(reviewType).isBlank() ? "NONE" : reviewType;
        this.review = value(review);
        this.pros = value(pros);
        this.cons = value(cons);
        this.memo = value(memo);
        this.updatedAt = Instant.now();
    }

    private static String value(String value) { return value == null ? "" : value.trim(); }
    public Long getId() { return id; }
    public String getServiceGroup() { return serviceGroup; }
    public String getItemName() { return itemName; }
    public String getVendorName() { return vendorName; }
    public String getStatus() { return status; }
    public LocalDate getScheduleDate() { return scheduleDate; }
    public BigDecimal getQuotedAmount() { return quotedAmount; }
    public BigDecimal getActualAmount() { return actualAmount; }
    public Integer getRating() { return rating; }
    public String getReviewType() { return reviewType; }
    public String getReview() { return review; }
    public String getPros() { return pros; }
    public String getCons() { return cons; }
    public String getMemo() { return memo; }
}
