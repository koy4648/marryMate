package com.marrymate.planning.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.marrymate.planning.domain.PlanningItem;

public interface PlanningItemRepository extends JpaRepository<PlanningItem, Long> {
    List<PlanningItem> findAllByWorkspaceIdOrderByServiceGroupAscItemNameAscIdAsc(Long workspaceId);
    Optional<PlanningItem> findByIdAndWorkspaceId(Long id, Long workspaceId);
    boolean existsByWorkspaceId(Long workspaceId);
}
