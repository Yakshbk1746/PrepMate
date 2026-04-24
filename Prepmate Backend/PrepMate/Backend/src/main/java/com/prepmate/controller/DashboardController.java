package com.prepmate.controller;

import com.prepmate.model.*;
import com.prepmate.service.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    private final TaskService taskService;
    private final RevisionService revisionService;
    private final HabitService habitService;
    private final TestService testService;
    private final TimerSessionService timerSessionService;
    private final DistractionService distractionService;
    public DashboardController(TaskService taskService, RevisionService revisionService, HabitService habitService, TestService testService, TimerSessionService timerSessionService, DistractionService distractionService) {
        this.taskService = taskService;
        this.revisionService = revisionService;
        this.habitService = habitService;
        this.testService = testService;
        this.timerSessionService = timerSessionService;
        this.distractionService = distractionService;
    }


    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats(@RequestParam Long userId) {
        Map<String, Object> stats = new HashMap<>();

        // Today's tasks
        List<Task> todayTasks = taskService.getTasksByDate(userId, LocalDate.now());
        long completedTasks = todayTasks.stream().filter(t -> "completed".equalsIgnoreCase(t.getStatus())).count();
        stats.put("todayTotalTasks", todayTasks.size());
        stats.put("todayCompletedTasks", completedTasks);

        // Active revisions
        List<Revision> upcomingRevisions = revisionService.getUpcomingRevisions(userId);
        long overdueCount = upcomingRevisions.stream()
                .filter(r -> r.getScheduledDate() != null && r.getScheduledDate().isBefore(LocalDate.now()))
                .count();
        stats.put("activeRevisions", upcomingRevisions.size());
        stats.put("overdueRevisions", overdueCount);

        // Habits
        List<Habit> habits = habitService.getAllHabits(userId);
        int maxStreak = habits.stream().mapToInt(h -> h.getStreak() != null ? h.getStreak() : 0).max().orElse(0);
        int longestMaxStreak = habits.stream().mapToInt(h -> h.getLongestStreak() != null ? h.getLongestStreak() : 0).max().orElse(0);
        stats.put("totalHabits", habits.size());
        stats.put("currentMaxStreak", maxStreak);
        stats.put("longestMaxStreak", longestMaxStreak);

        // Today's study time from timer sessions
        List<TimerSession> todaySessions = timerSessionService.getSessionsByDate(userId, LocalDate.now());
        int totalStudySeconds = todaySessions.stream()
                .mapToInt(s -> s.getDuration() != null ? s.getDuration() : 0).sum();
        stats.put("todayStudyMinutes", totalStudySeconds / 60);

        // Test stats
        stats.put("testStats", testService.getTestStats(userId));

        // Today's distractions
        stats.put("distractionStats", distractionService.getStats(userId));

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/tasks")
    public ResponseEntity<Map<String, Object>> getDashboardTasks(@RequestParam Long userId) {
        List<Task> tasks = taskService.getTasksByDate(userId, LocalDate.now());
        long completedCount = tasks.stream()
                .filter(task -> "completed".equalsIgnoreCase(task.getStatus()) || Boolean.TRUE.equals(task.getCompleted()))
                .count();

        Map<String, Object> payload = new HashMap<>();
        payload.put("count", tasks.size());
        payload.put("completedCount", completedCount);
        payload.put("tasks", tasks);
        return ResponseEntity.ok(payload);
    }

    @GetMapping("/revisions")
    public ResponseEntity<Map<String, Object>> getDashboardRevisions(@RequestParam Long userId) {
        List<Revision> revisions = revisionService.getAllRevisions(userId);
        long completedCount = revisions.stream().filter(revision -> Boolean.TRUE.equals(revision.getCompleted())).count();

        Map<String, Object> payload = new HashMap<>();
        payload.put("count", revisions.size());
        payload.put("completedCount", completedCount);
        payload.put("revisions", revisions);
        return ResponseEntity.ok(payload);
    }
}

