package com.prepmate.repository;

import com.prepmate.model.MonthlyPlanTask;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MonthlyPlanTaskRepository extends JpaRepository<MonthlyPlanTask, Long> {
    List<MonthlyPlanTask> findByUserIdAndMonthAndYear(Long userId, Integer month, Integer year);
    List<MonthlyPlanTask> findByUserId(Long userId);
}
