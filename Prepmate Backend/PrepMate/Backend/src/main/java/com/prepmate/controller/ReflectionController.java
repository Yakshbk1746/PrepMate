package com.prepmate.controller;

import com.prepmate.model.Reflection;
import com.prepmate.service.ReflectionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/reflections")
public class ReflectionController {

    private final ReflectionService reflectionService;
    public ReflectionController(ReflectionService reflectionService) {
        this.reflectionService = reflectionService;
    }


    @GetMapping
    public ResponseEntity<List<Reflection>> getAllReflections(@RequestParam Long userId) {
        return ResponseEntity.ok(reflectionService.getAllReflections(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Reflection> getReflectionById(@PathVariable Long id) {
        return ResponseEntity.ok(reflectionService.getReflectionById(id));
    }

    @GetMapping("/monthly-stats")
    public ResponseEntity<Map<String, Object>> getMonthlyStats(@RequestParam Long userId,
            @RequestParam int year, @RequestParam int month) {
        return ResponseEntity.ok(reflectionService.getMonthlyStats(userId, year, month));
    }

    @PostMapping
    public ResponseEntity<Reflection> createReflection(@RequestParam Long userId, @RequestBody Reflection reflection) {
        reflection.setUserId(userId);
        return ResponseEntity.ok(reflectionService.createReflection(reflection));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Reflection> updateReflection(@PathVariable Long id, @RequestBody Reflection reflection) {
        return ResponseEntity.ok(reflectionService.updateReflection(id, reflection));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReflection(@PathVariable Long id) {
        reflectionService.deleteReflection(id);
        return ResponseEntity.noContent().build();
    }
}

