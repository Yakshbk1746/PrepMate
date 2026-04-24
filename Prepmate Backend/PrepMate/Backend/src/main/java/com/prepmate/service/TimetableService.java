package com.prepmate.service;

import com.prepmate.model.TimetableEvent;
import com.prepmate.repository.TimetableEventRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;

@Service
public class TimetableService {

    private final TimetableEventRepository timetableEventRepository;
    public TimetableService(TimetableEventRepository timetableEventRepository) {
        this.timetableEventRepository = timetableEventRepository;
    }


    public List<TimetableEvent> getEventsByDate(Long userId, LocalDate date) {
        return timetableEventRepository.findByUserIdAndDate(userId, date);
    }

    public List<TimetableEvent> getAllEvents(Long userId) {
        return timetableEventRepository.findByUserId(userId);
    }

    public TimetableEvent createEvent(TimetableEvent event) {
        if (event.getDate() == null) event.setDate(LocalDate.now());
        return timetableEventRepository.save(event);
    }

    public TimetableEvent updateEvent(Long id, TimetableEvent updated) {
        TimetableEvent event = timetableEventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Timetable event not found with id: " + id));
        if (updated.getTitle() != null) event.setTitle(updated.getTitle());
        if (updated.getStartTime() != null) event.setStartTime(updated.getStartTime());
        if (updated.getEndTime() != null) event.setEndTime(updated.getEndTime());
        if (updated.getColor() != null) event.setColor(updated.getColor());
        if (updated.getDate() != null) event.setDate(updated.getDate());
        return timetableEventRepository.save(event);
    }

    public void deleteEvent(Long id) {
        timetableEventRepository.deleteById(id);
    }
}

