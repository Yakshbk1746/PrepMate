package com.prepmate.controller;

import com.prepmate.model.Habit;
import com.prepmate.service.HabitService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/habits")
public class HabitController {

    private final HabitService habitService;
    public HabitController(HabitService habitService) {
        this.habitService = habitService;
    }


    @GetMapping
    public ResponseEntity<List<Habit>> getAllHabits(@RequestParam Long userId) {
        return ResponseEntity.ok(habitService.getAllHabits(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Habit> getHabitById(@PathVariable Long id) {
        return ResponseEntity.ok(habitService.getHabitById(id));
    }

    @PostMapping
    public ResponseEntity<Habit> createHabit(@RequestParam Long userId, @RequestBody Habit habit) {
        habit.setUserId(userId);
        return ResponseEntity.ok(habitService.createHabit(habit));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Habit> updateHabit(@PathVariable Long id, @RequestBody Habit habit) {
        return ResponseEntity.ok(habitService.updateHabit(id, habit));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<Habit> toggleCompletion(@PathVariable Long id, @RequestParam String date) {
        return ResponseEntity.ok(habitService.toggleCompletion(id, date));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteHabit(@PathVariable Long id) {
        habitService.deleteHabit(id);
        return ResponseEntity.noContent().build();
    }
}

