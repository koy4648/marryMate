package com.marrymate.identity.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import com.marrymate.identity.domain.CoupleWorkspace;
public interface WorkspaceRepository extends JpaRepository<CoupleWorkspace, Long> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select w from CoupleWorkspace w where w.id = :id")
    java.util.Optional<CoupleWorkspace> lockById(@org.springframework.data.repository.query.Param("id") Long id);
}

