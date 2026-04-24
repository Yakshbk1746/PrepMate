package com.prepmate.repository;

import com.prepmate.model.WellbeingLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface WellbeingLogRepository extends JpaRepository<WellbeingLog, Long> {
    Optional<WellbeingLog> findByUserIdAndDate(Long userId, LocalDate date);
    List<WellbeingLog> findByUserIdAndDateBetween(Long userId, LocalDate start, LocalDate end);
    List<WellbeingLog> findByUserIdOrderByDateDesc(Long userId);
}
