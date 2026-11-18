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

    @Column(name="include_honeymoon", nullable=false) private boolean includeHoneymoon = true;
    @Column(name="include_gifts", nullable=false) private boolean includeGifts;
    @Column(name="gift_amount", nullable=false, precision=15, scale=0) private BigDecimal giftAmount = BigDecimal.ZERO;
    public boolean isIncludeHoneymoon() { return includeHoneymoon; }
    public boolean isIncludeGifts() { return includeGifts; }
    public BigDecimal getGiftAmount() { return giftAmount; }
    public void preferences(boolean honeymoon, boolean gifts, BigDecimal amount) { includeHoneymoon=honeymoon; includeGifts=gifts; giftAmount=amount; updatedAt=Instant.now(); }
    protected BudgetPlan() {}
    public BudgetPlan(Long workspaceId) { this.workspaceId = workspaceId; this.targetAmount = BigDecimal.ZERO; this.createdAt = Instant.now(); this.updatedAt = this.createdAt; }
    public BigDecimal getTargetAmount() { return targetAmount; }
    public void changeTarget(BigDecimal amount) { this.targetAmount = amount; this.updatedAt = Instant.now(); }
}

