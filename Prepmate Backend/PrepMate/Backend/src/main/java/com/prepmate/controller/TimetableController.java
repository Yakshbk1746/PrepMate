package com.prepmate.controller;

import com.prepmate.model.TimetableEvent;
import com.prepmate.service.TimetableService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/timetable")
public class TimetableController {

    private final TimetableService timetableService;
    public TimetableController(TimetableService timetableService) {
        this.timetableService = timetableService;
    }


    @GetMapping
    public ResponseEntity<List<TimetableEvent>> getAllEvents(@RequestParam Long userId) {
        return ResponseEntity.ok(timetableService.getAllEvents(userId));
    }

    @GetMapping("/date/{date}")
    public ResponseEntity<List<TimetableEvent>> getEventsByDate(@RequestParam Long userId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(timetableService.getEventsByDate(userId, date));
    }

    @PostMapping
    public ResponseEntity<TimetableEvent> createEvent(@RequestParam Long userId, @RequestBody TimetableEvent event) {
        event.setUserId(userId);
        return ResponseEntity.ok(timetableService.createEvent(event));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TimetableEvent> updateEvent(@PathVariable Long id, @RequestBody TimetableEvent event) {
        return ResponseEntity.ok(timetableService.updateEvent(id, event));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable Long id) {
        timetableService.deleteEvent(id);
        return ResponseEntity.noContent().build();
    }
}

