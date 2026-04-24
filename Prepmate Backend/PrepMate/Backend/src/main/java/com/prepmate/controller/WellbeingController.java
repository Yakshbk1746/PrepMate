package com.prepmate.controller;

import com.prepmate.model.WellbeingLog;
import com.prepmate.service.WellbeingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/wellbeing")
public class WellbeingController {

    private final WellbeingService wellbeingService;
    public WellbeingController(WellbeingService wellbeingService) {
        this.wellbeingService = wellbeingService;
    }


    @PostMapping
    public ResponseEntity<WellbeingLog> logOrUpdate(@RequestParam Long userId, @RequestBody WellbeingLog log) {
        log.setUserId(userId);
        return ResponseEntity.ok(wellbeingService.logOrUpdate(log));
    }

    @GetMapping("/today")
    public ResponseEntity<WellbeingLog> getToday(@RequestParam Long userId) {
        WellbeingLog log = wellbeingService.getToday(userId);
        return log != null ? ResponseEntity.ok(log) : ResponseEntity.noContent().build();
    }

    @GetMapping("/weekly")
    public ResponseEntity<List<WellbeingLog>> getWeeklyData(@RequestParam Long userId) {
        return ResponseEntity.ok(wellbeingService.getWeeklyData(userId));
    }

    @GetMapping
    public ResponseEntity<List<WellbeingLog>> getAllLogs(@RequestParam Long userId) {
        return ResponseEntity.ok(wellbeingService.getAllLogs(userId));
    }
}

