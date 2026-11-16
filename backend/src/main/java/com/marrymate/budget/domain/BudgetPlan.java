package com.marrymate.budget.domain;

import java.math.BigDecimal;
import java.time.Instant;
import jakarta.persistence.*;

@Entity
@Table(name = "budget_plans")
public class BudgetPlan {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "workspace_id", nullable = false, unique = true) private Long workspaceId;
    @Column(name = "target_amount", nullable = false, precision = 15, scale = 0) private BigDecimal targetAmount;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;

    protected BudgetPlan() {}
    public BudgetPlan(Long workspaceId) { this.workspaceId = workspaceId; this.targetAmount = BigDecimal.ZERO; this.createdAt = Instant.now(); this.updatedAt = this.createdAt; }
    public BigDecimal getTargetAmount() { return targetAmount; }
    public void changeTarget(BigDecimal amount) { this.targetAmount = amount; this.updatedAt = Instant.now(); }
}

