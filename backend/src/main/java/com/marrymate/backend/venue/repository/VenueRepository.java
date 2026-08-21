package com.marrymate.backend.venue.repository;
import com.marrymate.backend.venue.domain.Venue;
import org.springframework.data.jpa.repository.JpaRepository;
public interface VenueRepository extends JpaRepository<Venue, Long> {}
