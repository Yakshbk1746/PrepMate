package com.prepmate.repository;

import com.prepmate.model.TimerSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface TimerSessionRepository extends JpaRepository<TimerSession, Long> {
    List<TimerSession> findByUserIdOrderByDateDesc(Long userId);
    List<TimerSession> findByUserIdAndDate(Long userId, LocalDate date);
    List<TimerSession> findByUserIdAndType(Long userId, String type);
}
