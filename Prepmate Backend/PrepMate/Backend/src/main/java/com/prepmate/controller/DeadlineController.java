package com.prepmate.controller;

import com.prepmate.model.Deadline;
import com.prepmate.service.DeadlineService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/deadlines")
public class DeadlineController {

    private final DeadlineService deadlineService;
    public DeadlineController(DeadlineService deadlineService) {
        this.deadlineService = deadlineService;
    }


    @GetMapping
    public ResponseEntity<List<Deadline>> getAllDeadlines(@RequestParam Long userId) {
        return ResponseEntity.ok(deadlineService.getAllDeadlines(userId));
    }

    @GetMapping("/active")
    public ResponseEntity<List<Deadline>> getActiveDeadlines(@RequestParam Long userId) {
        return ResponseEntity.ok(deadlineService.getActiveDeadlines(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Deadline> getDeadlineById(@PathVariable Long id) {
        return ResponseEntity.ok(deadlineService.getDeadlineById(id));
    }

    @PostMapping
    public ResponseEntity<Deadline> createDeadline(@RequestParam Long userId, @RequestBody Deadline deadline) {
        deadline.setUserId(userId);
        return ResponseEntity.ok(deadlineService.createDeadline(deadline));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Deadline> updateDeadline(@PathVariable Long id, @RequestBody Deadline deadline) {
        return ResponseEntity.ok(deadlineService.updateDeadline(id, deadline));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<Deadline> toggleComplete(@PathVariable Long id) {
        return ResponseEntity.ok(deadlineService.toggleComplete(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDeadline(@PathVariable Long id) {
        deadlineService.deleteDeadline(id);
        return ResponseEntity.noContent().build();
    }
}

