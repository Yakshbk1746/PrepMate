package com.prepmate.controller;

import com.prepmate.model.Distraction;
import com.prepmate.service.DistractionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/distractions")
public class DistractionController {

    private final DistractionService distractionService;
    public DistractionController(DistractionService distractionService) {
        this.distractionService = distractionService;
    }


    @GetMapping
    public ResponseEntity<List<Distraction>> getAllDistractions(@RequestParam Long userId) {
        return ResponseEntity.ok(distractionService.getAllDistractions(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Distraction> getDistractionById(@PathVariable Long id) {
        return ResponseEntity.ok(distractionService.getDistractionById(id));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(@RequestParam Long userId) {
        return ResponseEntity.ok(distractionService.getStats(userId));
    }

    @PostMapping
    public ResponseEntity<Distraction> createDistraction(@RequestParam Long userId, @RequestBody Distraction distraction) {
        distraction.setUserId(userId);
        return ResponseEntity.ok(distractionService.createDistraction(distraction));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDistraction(@PathVariable Long id) {
        distractionService.deleteDistraction(id);
        return ResponseEntity.noContent().build();
    }
}

