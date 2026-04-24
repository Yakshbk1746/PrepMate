package com.prepmate.service;

import com.prepmate.exception.CustomValidationException;
import com.prepmate.model.YearlyPlan;
import com.prepmate.model.MonthlyPlanTask;
import com.prepmate.model.WeeklyPlanTopic;
import com.prepmate.repository.YearlyPlanRepository;
import com.prepmate.repository.MonthlyPlanTaskRepository;
import com.prepmate.repository.WeeklyPlanTopicRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.List;

@Service
public class PlannerService {

    private final YearlyPlanRepository yearlyPlanRepository;
    private final MonthlyPlanTaskRepository monthlyPlanTaskRepository;
    private final WeeklyPlanTopicRepository weeklyPlanTopicRepository;
    public PlannerService(YearlyPlanRepository yearlyPlanRepository, MonthlyPlanTaskRepository monthlyPlanTaskRepository, WeeklyPlanTopicRepository weeklyPlanTopicRepository) {
        this.yearlyPlanRepository = yearlyPlanRepository;
        this.monthlyPlanTaskRepository = monthlyPlanTaskRepository;
        this.weeklyPlanTopicRepository = weeklyPlanTopicRepository;
    }


    // ===== Yearly Plans =====
    public List<YearlyPlan> getYearlyPlans(Long userId, Integer year) {
        return yearlyPlanRepository.findByUserIdAndYear(userId, year);
    }

    public YearlyPlan createYearlyPlan(YearlyPlan plan) {
        if (plan.getProgress() == null) plan.setProgress(0);
        return yearlyPlanRepository.save(plan);
    }

    public YearlyPlan updateYearlyPlan(Long id, YearlyPlan updated) {
        YearlyPlan plan = yearlyPlanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Yearly plan not found with id: " + id));
        if (updated.getSubjectId() != null) plan.setSubjectId(updated.getSubjectId());
        if (updated.getTopic() != null) plan.setTopic(updated.getTopic());
        if (updated.getStartMonth() != null) plan.setStartMonth(updated.getStartMonth());
        if (updated.getEndMonth() != null) plan.setEndMonth(updated.getEndMonth());
        if (updated.getProgress() != null) plan.setProgress(updated.getProgress());
        return yearlyPlanRepository.save(plan);
    }

    public void deleteYearlyPlan(Long id) {
        yearlyPlanRepository.deleteById(id);
    }

    // ===== Monthly Plans =====
    public List<MonthlyPlanTask> getMonthlyTasks(Long userId, Integer month, Integer year) {
        return monthlyPlanTaskRepository.findByUserIdAndMonthAndYear(userId, month, year);
    }

    public MonthlyPlanTask createMonthlyTask(MonthlyPlanTask task) {
        if (task.getStatus() == null) task.setStatus("todo");
        return monthlyPlanTaskRepository.save(task);
    }

    public MonthlyPlanTask updateMonthlyTask(Long id, MonthlyPlanTask updated) {
        MonthlyPlanTask task = monthlyPlanTaskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Monthly plan task not found with id: " + id));
        if (updated.getWeekNumber() != null) task.setWeekNumber(updated.getWeekNumber());
        if (updated.getSubjectId() != null) task.setSubjectId(updated.getSubjectId());
        if (updated.getTopic() != null) task.setTopic(updated.getTopic());
        if (updated.getStatus() != null) task.setStatus(updated.getStatus());
        return monthlyPlanTaskRepository.save(task);
    }

    public void deleteMonthlyTask(Long id) {
        monthlyPlanTaskRepository.deleteById(id);
    }

    // ===== Weekly Plans =====
    public List<WeeklyPlanTopic> getWeeklyTopics(Long userId, LocalDate weekStartDate) {
        return weeklyPlanTopicRepository.findByUserIdAndWeekStartDate(userId, weekStartDate);
    }

    public WeeklyPlanTopic createWeeklyTopic(WeeklyPlanTopic topic) {
        System.out.println("[PlannerService.createWeeklyTopic] Creating weekly topic: "
                + "userId=" + topic.getUserId() 
                + ", subject=" + topic.getSubject() 
                + ", topic=" + topic.getTopic() 
                + ", weekStartDate=" + topic.getWeekStartDate()
                + ", dayOfWeek=" + topic.getDayOfWeek());
        
        if (topic.getWeekStartDate() == null) {
            System.err.println("[PlannerService] ERROR: weekStartDate is null!");
            throw new RuntimeException("weekStartDate is required and cannot be null");
        }
        
        if (topic.getUserId() == null) {
            System.err.println("[PlannerService] ERROR: userId is null!");
            throw new RuntimeException("userId is required and cannot be null");
        }

        validateTimeRange(topic.getTimeFrom(), topic.getTimeTo());
        
        WeeklyPlanTopic saved = weeklyPlanTopicRepository.save(topic);
        System.out.println("[PlannerService] Weekly topic created successfully with id: " + saved.getId());
        return saved;
    }

    public WeeklyPlanTopic updateWeeklyTopic(Long id, WeeklyPlanTopic updated) {
        WeeklyPlanTopic topic = weeklyPlanTopicRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Weekly plan topic not found with id: " + id));

        String nextTimeFrom = updated.getTimeFrom() != null ? updated.getTimeFrom() : topic.getTimeFrom();
        String nextTimeTo = updated.getTimeTo() != null ? updated.getTimeTo() : topic.getTimeTo();
        validateTimeRange(nextTimeFrom, nextTimeTo);

        if (updated.getSubject() != null) topic.setSubject(updated.getSubject());
        if (updated.getTopic() != null) topic.setTopic(updated.getTopic());
        if (updated.getTimeFrom() != null) topic.setTimeFrom(updated.getTimeFrom());
        if (updated.getTimeTo() != null) topic.setTimeTo(updated.getTimeTo());
        if (updated.getDayOfWeek() != null) topic.setDayOfWeek(updated.getDayOfWeek());
        return weeklyPlanTopicRepository.save(topic);
    }

    public void deleteWeeklyTopic(Long id) {
        weeklyPlanTopicRepository.deleteById(id);
    }

    private void validateTimeRange(String timeFrom, String timeTo) {
        if (timeFrom == null || timeTo == null || timeFrom.isBlank() || timeTo.isBlank()) {
            return;
        }

        try {
            LocalTime startTime = LocalTime.parse(timeFrom);
            LocalTime endTime = LocalTime.parse(timeTo);
            if (endTime.isBefore(startTime)) {
                throw new CustomValidationException("End time cannot be earlier than start time.");
            }
        } catch (DateTimeParseException ex) {
            throw new CustomValidationException("Invalid time format. Expected HH:mm");
        }
    }
}

