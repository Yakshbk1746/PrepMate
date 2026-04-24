package com.prepmate.controller;

import com.prepmate.model.Task;
import com.prepmate.service.TaskService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/tasks")
public class TaskController {

    private final TaskService taskService;
    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }


    @GetMapping
    public ResponseEntity<List<Task>> getAllTasks(@RequestParam Long userId) {
        return ResponseEntity.ok(taskService.getAllTasks(userId));
    }

    @GetMapping("/date/{date}")
    public ResponseEntity<List<Task>> getTasksByDate(@RequestParam Long userId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(taskService.getTasksByDate(userId, date));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Task>> getTasksByStatus(@RequestParam Long userId, @PathVariable String status) {
        return ResponseEntity.ok(taskService.getTasksByStatus(userId, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Task> getTaskById(@RequestParam Long userId, @PathVariable Long id) {
        return ResponseEntity.ok(taskService.getTaskById(userId, id));
    }

    @PostMapping
    public ResponseEntity<Task> createTask(@RequestParam Long userId, @RequestBody Task task) {
        task.setUserId(userId);
        return ResponseEntity.ok(taskService.createTask(task));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Task> updateTask(@PathVariable Long id, @RequestBody Task task) {
        return ResponseEntity.ok(taskService.updateTask(id, task));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Task> updateStatus(@RequestParam Long userId, @PathVariable Long id, @RequestParam String status) {
        return ResponseEntity.ok(taskService.updateTaskStatus(userId, id, status));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@RequestParam Long userId, @PathVariable Long id) {
        taskService.deleteTask(userId, id);
        return ResponseEntity.noContent().build();
    }
}

