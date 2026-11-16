package com.marrymate.budget.repository;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.marrymate.budget.domain.BudgetPlan;
public interface BudgetPlanRepository extends JpaRepository<BudgetPlan, Long> { Optional<BudgetPlan> findByWorkspaceId(Long workspaceId); }

