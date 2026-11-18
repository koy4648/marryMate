package com.marrymate.budget.repository;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
import com.marrymate.budget.domain.Payment;
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    boolean existsByPlanningItemId(Long planningItemId); List<Payment> findAllByWorkspaceIdOrderByDueDateAsc(Long workspaceId); Optional<Payment> findByIdAndWorkspaceId(Long id, Long workspaceId); }

