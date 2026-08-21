package com.marrymate.backend.venue.repository;

import com.marrymate.backend.venue.domain.VenuePlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface VenuePlanRepository extends JpaRepository<VenuePlan, Long> {
    @Query("select p from VenuePlan p join fetch p.venue where p.workspace.id = :workspaceId order by p.createdAt desc")
    List<VenuePlan> findAllByWorkspace(@Param("workspaceId") Long workspaceId);
    @Query("select p from VenuePlan p join fetch p.venue where p.id = :id and p.workspace.id = :workspaceId")
    Optional<VenuePlan> findAccessible(@Param("id") Long id, @Param("workspaceId") Long workspaceId);
}
