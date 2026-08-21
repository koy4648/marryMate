package com.marrymate.backend.venue.repository;

import com.marrymate.backend.venue.domain.VenueVisit;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface VenueVisitRepository extends JpaRepository<VenueVisit, Long> {
    List<VenueVisit> findAllByVenuePlanIdOrderByCreatedAtDesc(Long planId);
    Optional<VenueVisit> findByIdAndVenuePlanId(Long id, Long planId);
}
