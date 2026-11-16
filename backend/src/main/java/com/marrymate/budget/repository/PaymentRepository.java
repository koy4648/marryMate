package com.marrymate.budget.repository;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
import com.marrymate.budget.domain.Payment;
public interface PaymentRepository extends JpaRepository<Payment, Long> { List<Payment> findAllByWorkspaceIdOrderByDueDateAsc(Long workspaceId); Optional<Payment> findByIdAndWorkspaceId(Long id, Long workspaceId); }

