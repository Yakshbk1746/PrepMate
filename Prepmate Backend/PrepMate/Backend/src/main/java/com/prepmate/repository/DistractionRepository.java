package com.prepmate.repository;

import com.prepmate.model.Distraction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface DistractionRepository extends JpaRepository<Distraction, Long> {
    List<Distraction> findByUserIdOrderByDateDesc(Long userId);
    List<Distraction> findByUserIdAndDate(Long userId, LocalDate date);
}
