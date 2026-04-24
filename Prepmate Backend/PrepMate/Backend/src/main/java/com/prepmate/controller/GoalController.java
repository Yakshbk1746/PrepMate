package com.prepmate.controller;

import com.prepmate.model.Goal;
import com.prepmate.service.GoalService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/goals")
public class GoalController {

    private final GoalService goalService;
    public GoalController(GoalService goalService) {
        this.goalService = goalService;
    }


    @GetMapping
    public ResponseEntity<List<Goal>> getAllGoals(@RequestParam Long userId) {
        return ResponseEntity.ok(goalService.getAllGoals(userId));
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<Goal>> getGoalsByType(@RequestParam Long userId, @PathVariable String type) {
        return ResponseEntity.ok(goalService.getGoalsByType(userId, type));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Goal> getGoalById(@PathVariable Long id) {
        return ResponseEntity.ok(goalService.getGoalById(id));
    }

    @PostMapping
    public ResponseEntity<Goal> createGoal(@RequestParam Long userId, @RequestBody Goal goal) {
        goal.setUserId(userId);
        return ResponseEntity.ok(goalService.createGoal(goal));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Goal> updateGoal(@PathVariable Long id, @RequestBody Goal goal) {
        return ResponseEntity.ok(goalService.updateGoal(id, goal));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGoal(@PathVariable Long id) {
        goalService.deleteGoal(id);
        return ResponseEntity.noContent().build();
    }
}

