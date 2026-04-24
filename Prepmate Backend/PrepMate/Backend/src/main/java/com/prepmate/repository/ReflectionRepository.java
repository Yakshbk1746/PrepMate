package com.prepmate.repository;

import com.prepmate.model.Reflection;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ReflectionRepository extends JpaRepository<Reflection, Long> {
    List<Reflection> findByUserIdOrderByDateDesc(Long userId);
    Optional<Reflection> findByUserIdAndDate(Long userId, LocalDate date);
    List<Reflection> findByUserIdAndDateBetween(Long userId, LocalDate start, LocalDate end);
}
