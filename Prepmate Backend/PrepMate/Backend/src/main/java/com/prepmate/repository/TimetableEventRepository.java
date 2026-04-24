package com.prepmate.repository;

import com.prepmate.model.TimetableEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface TimetableEventRepository extends JpaRepository<TimetableEvent, Long> {
    List<TimetableEvent> findByUserIdAndDate(Long userId, LocalDate date);
    List<TimetableEvent> findByUserId(Long userId);
}
