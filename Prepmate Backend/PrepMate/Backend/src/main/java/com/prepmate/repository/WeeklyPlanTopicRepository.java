package com.prepmate.repository;

import com.prepmate.model.WeeklyPlanTopic;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface WeeklyPlanTopicRepository extends JpaRepository<WeeklyPlanTopic, Long> {
    List<WeeklyPlanTopic> findByUserIdAndWeekStartDate(Long userId, LocalDate weekStartDate);
    List<WeeklyPlanTopic> findByUserId(Long userId);
}
