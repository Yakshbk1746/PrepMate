package com.prepmate.repository;

import com.prepmate.model.YearlyPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface YearlyPlanRepository extends JpaRepository<YearlyPlan, Long> {
    List<YearlyPlan> findByUserIdAndYear(Long userId, Integer year);
    List<YearlyPlan> findByUserId(Long userId);
}
