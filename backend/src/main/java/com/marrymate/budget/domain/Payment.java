package com.marrymate.budget.domain;

import java.math.BigDecimal;
import java.time.*;
import jakarta.persistence.*;

@Entity
@Table(name = "payments")
public class Payment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "workspace_id", nullable = false) private Long workspaceId;
    @Column(nullable = false, length = 80) private String category;
    @Column(nullable = false, length = 160) private String title;
    @Column(name = "payment_type", nullable = false, length = 30) private String type;
    @Column(nullable = false, length = 30) private String status;
    @Column(name = "scheduled_amount", nullable = false, precision = 15, scale = 0) private BigDecimal scheduledAmount;
    @Column(name = "actual_amount", nullable = false, precision = 15, scale = 0) private BigDecimal actualAmount;
    @Column(name = "due_date", nullable = false) private LocalDate dueDate;
    @Column(name = "paid_date") private LocalDate paidDate;
    @Column(nullable = false, length = 80) private String payer;
    @Column(nullable = false, length = 1000) private String memo;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;

    @Column(name="planning_item_id") private Long planningItemId;
    public Long getPlanningItemId() { return planningItemId; }
    public void linkPlanningItem(Long id) { planningItemId=id; }
    public void revise(BigDecimal amount, LocalDate date, String payer, boolean paid, LocalDate paidDate) {
        scheduledAmount=amount; dueDate=date; this.payer=normalizePayer(payer);
        actualAmount=paid ? amount : BigDecimal.ZERO; this.paidDate=paid ? paidDate : null;
        status=paid ? "PAID" : "SCHEDULED"; updatedAt=Instant.now();
    }
    public void updateExtra(String category,String title,BigDecimal amount,LocalDate date,String memo) {
        this.category=category; this.title=title; this.scheduledAmount=amount; this.dueDate=date; this.memo=memo;
        this.status=actualAmount.signum()==0?"SCHEDULED":actualAmount.compareTo(amount)>=0?"PAID":"PARTIALLY_PAID";
        this.updatedAt=Instant.now();
    }
    public void cancelScheduled() {
        if(actualAmount.signum()>0 || "PAID".equals(status)) throw new IllegalStateException("납부 기록이 있는 결제는 취소할 수 없어요.");
        status="CANCELLED"; updatedAt=Instant.now();
    }
    private static String normalizePayer(String payer) { return payer==null || payer.isBlank()?"미정":payer.trim(); }
    protected Payment() {}
    public Payment(Long workspaceId, String category, String title, String type, BigDecimal scheduledAmount, LocalDate dueDate, String payer, String memo) {
        this.workspaceId = workspaceId; this.category = category; this.title = title; this.type = type; this.status = "SCHEDULED";
        this.scheduledAmount = scheduledAmount; this.actualAmount = BigDecimal.ZERO; this.dueDate = dueDate; this.payer = normalizePayer(payer); this.memo = memo == null ? "" : memo;
        this.createdAt = Instant.now(); this.updatedAt = this.createdAt;
    }
    public Long getId() { return id; } public String getCategory() { return category; } public String getTitle() { return title; }
    public String getType() { return type; } public String getStatus() { return status; } public BigDecimal getScheduledAmount() { return scheduledAmount; }
    public BigDecimal getActualAmount() { return actualAmount; } public LocalDate getDueDate() { return dueDate; } public LocalDate getPaidDate() { return paidDate; }
    public String getPayer() { return normalizePayer(payer); } public String getMemo() { return memo; }
    public void complete(BigDecimal actualAmount, LocalDate paidDate, String payer) { this.actualAmount = actualAmount; this.paidDate = paidDate; this.status = actualAmount.compareTo(scheduledAmount) < 0 ? "PARTIALLY_PAID" : "PAID"; this.payer=normalizePayer(payer); this.updatedAt = Instant.now(); }
}

