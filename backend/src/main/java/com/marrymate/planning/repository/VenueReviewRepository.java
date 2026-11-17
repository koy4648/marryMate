package com.marrymate.planning.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.marrymate.planning.domain.VenueReview;

public interface VenueReviewRepository extends JpaRepository<VenueReview,Long> {
    List<VenueReview> findAllByWorkspaceIdOrderByCreatedAtDesc(Long workspaceId);
    Optional<VenueReview> findByIdAndWorkspaceId(Long id, Long workspaceId);
}
