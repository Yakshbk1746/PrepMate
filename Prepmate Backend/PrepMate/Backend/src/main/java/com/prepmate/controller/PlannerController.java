package com.prepmate.controller;

import com.prepmate.model.YearlyPlan;
import com.prepmate.model.MonthlyPlanTask;
import com.prepmate.model.WeeklyPlanTopic;
import com.prepmate.service.PlannerService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/planner")
public class PlannerController {

    private final PlannerService plannerService;
    public PlannerController(PlannerService plannerService) {
        this.plannerService = plannerService;
    }


    // ===== Yearly Plans =====
    @GetMapping("/yearly")
    public ResponseEntity<List<YearlyPlan>> getYearlyPlans(@RequestParam Long userId, @RequestParam Integer year) {
        return ResponseEntity.ok(plannerService.getYearlyPlans(userId, year));
    }

    @PostMapping("/yearly")
    public ResponseEntity<YearlyPlan> createYearlyPlan(@RequestParam Long userId, @RequestBody YearlyPlan plan) {
        plan.setUserId(userId);
        return ResponseEntity.ok(plannerService.createYearlyPlan(plan));
    }

    @PutMapping("/yearly/{id}")
    public ResponseEntity<YearlyPlan> updateYearlyPlan(@PathVariable Long id, @RequestBody YearlyPlan plan) {
        return ResponseEntity.ok(plannerService.updateYearlyPlan(id, plan));
    }

    @DeleteMapping("/yearly/{id}")
    public ResponseEntity<Void> deleteYearlyPlan(@PathVariable Long id) {
        plannerService.deleteYearlyPlan(id);
        return ResponseEntity.noContent().build();
    }

    // ===== Monthly Plans =====
    @GetMapping("/monthly")
    public ResponseEntity<List<MonthlyPlanTask>> getMonthlyTasks(@RequestParam Long userId,
            @RequestParam Integer month, @RequestParam Integer year) {
        return ResponseEntity.ok(plannerService.getMonthlyTasks(userId, month, year));
    }

    @PostMapping("/monthly")
    public ResponseEntity<MonthlyPlanTask> createMonthlyTask(@RequestParam Long userId, @RequestBody MonthlyPlanTask task) {
        task.setUserId(userId);
        return ResponseEntity.ok(plannerService.createMonthlyTask(task));
    }

    @PutMapping("/monthly/{id}")
    public ResponseEntity<MonthlyPlanTask> updateMonthlyTask(@PathVariable Long id, @RequestBody MonthlyPlanTask task) {
        return ResponseEntity.ok(plannerService.updateMonthlyTask(id, task));
    }

    @DeleteMapping("/monthly/{id}")
    public ResponseEntity<Void> deleteMonthlyTask(@PathVariable Long id) {
        plannerService.deleteMonthlyTask(id);
        return ResponseEntity.noContent().build();
    }

    // ===== Weekly Plans =====
    @GetMapping("/weekly")
    public ResponseEntity<List<WeeklyPlanTopic>> getWeeklyTopics(@RequestParam Long userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStartDate) {
        return ResponseEntity.ok(plannerService.getWeeklyTopics(userId, weekStartDate));
    }

    @PostMapping("/weekly")
    public ResponseEntity<WeeklyPlanTopic> createWeeklyTopic(@RequestParam Long userId, @RequestBody WeeklyPlanTopic topic) {
        System.out.println("[PlannerController] Received createWeeklyTopic request for userId: " + userId);
        System.out.println("[PlannerController] Topic data: weekStartDate=" + topic.getWeekStartDate() 
                + ", subject=" + topic.getSubject()
                + ", topic=" + topic.getTopic()
                + ", dayOfWeek=" + topic.getDayOfWeek());
        
        try {
            topic.setUserId(userId);
            WeeklyPlanTopic created = plannerService.createWeeklyTopic(topic);
            System.out.println("[PlannerController] Topic created successfully with id: " + created.getId());
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            System.err.println("[PlannerController] Error creating weekly topic: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @PutMapping("/weekly/{id}")
    public ResponseEntity<WeeklyPlanTopic> updateWeeklyTopic(@PathVariable Long id, @RequestBody WeeklyPlanTopic topic) {
        return ResponseEntity.ok(plannerService.updateWeeklyTopic(id, topic));
    }

    @DeleteMapping("/weekly/{id}")
    public ResponseEntity<Void> deleteWeeklyTopic(@PathVariable Long id) {
        plannerService.deleteWeeklyTopic(id);
        return ResponseEntity.noContent().build();
    }
}

