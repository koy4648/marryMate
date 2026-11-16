package com.marrymate.identity.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import com.marrymate.identity.domain.CoupleWorkspace;
public interface WorkspaceRepository extends JpaRepository<CoupleWorkspace, Long> {}

