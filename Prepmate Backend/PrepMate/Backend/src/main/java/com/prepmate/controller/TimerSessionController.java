package com.prepmate.controller;

import com.prepmate.model.TimerSession;
import com.prepmate.service.TimerSessionService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/timer-sessions")
public class TimerSessionController {

    private final TimerSessionService timerSessionService;
    public TimerSessionController(TimerSessionService timerSessionService) {
        this.timerSessionService = timerSessionService;
    }


    @GetMapping
    public ResponseEntity<List<TimerSession>> getAllSessions(@RequestParam Long userId) {
        return ResponseEntity.ok(timerSessionService.getAllSessions(userId));
    }

    @GetMapping("/date/{date}")
    public ResponseEntity<List<TimerSession>> getSessionsByDate(@RequestParam Long userId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(timerSessionService.getSessionsByDate(userId, date));
    }

    @PostMapping
    public ResponseEntity<TimerSession> logSession(@RequestParam Long userId, @RequestBody TimerSession session) {
        session.setUserId(userId);
        return ResponseEntity.ok(timerSessionService.logSession(session));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSession(@PathVariable Long id) {
        timerSessionService.deleteSession(id);
        return ResponseEntity.noContent().build();
    }
}

