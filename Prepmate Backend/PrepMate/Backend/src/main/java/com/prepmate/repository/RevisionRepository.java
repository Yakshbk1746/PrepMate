package com.prepmate.repository;

import com.prepmate.model.Revision;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface RevisionRepository extends JpaRepository<Revision, Long> {
    List<Revision> findByUserIdOrderByScheduledDateAsc(Long userId);
    List<Revision> findByUserIdAndScheduledDateBetween(Long userId, LocalDate start, LocalDate end);
    List<Revision> findByUserIdAndScheduledDateLessThanEqual(Long userId, LocalDate date);
    List<Revision> findByUserIdAndStatus(Long userId, String status);
}
