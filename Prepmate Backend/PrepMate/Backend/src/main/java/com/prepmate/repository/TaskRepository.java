package com.prepmate.repository;

import com.prepmate.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByUserId(Long userId);
    List<Task> findByUserIdOrderByDateDesc(Long userId);
    List<Task> findByUserIdAndDate(Long userId, LocalDate date);
    List<Task> findByUserIdAndStatus(Long userId, String status);
    List<Task> findByUserIdAndDateAndStatus(Long userId, LocalDate date, String status);
    Optional<Task> findByIdAndUserId(Long id, Long userId);
    long deleteByIdAndUserId(Long id, Long userId);
}
