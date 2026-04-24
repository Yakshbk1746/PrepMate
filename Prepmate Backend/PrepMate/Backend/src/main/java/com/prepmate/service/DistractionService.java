package com.prepmate.service;

import com.prepmate.model.Distraction;
import com.prepmate.repository.DistractionRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DistractionService {

    private final DistractionRepository distractionRepository;
    public DistractionService(DistractionRepository distractionRepository) {
        this.distractionRepository = distractionRepository;
    }


    public List<Distraction> getAllDistractions(Long userId) {
        return distractionRepository.findByUserIdOrderByDateDesc(userId);
    }

    public List<Distraction> getDistractionsByDate(Long userId, LocalDate date) {
        return distractionRepository.findByUserIdAndDate(userId, date);
    }

    public Distraction getDistractionById(Long id) {
        return distractionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Distraction not found with id: " + id));
    }

    public Distraction createDistraction(Distraction distraction) {
        if (distraction.getDate() == null) distraction.setDate(LocalDate.now());
        return distractionRepository.save(distraction);
    }

    public void deleteDistraction(Long id) {
        distractionRepository.deleteById(id);
    }

    public Map<String, Object> getStats(Long userId) {
        List<Distraction> all = distractionRepository.findByUserIdOrderByDateDesc(userId);
        Map<String, Object> stats = new HashMap<>();

        int totalDuration = all.stream().mapToInt(d -> d.getDuration() != null ? d.getDuration() : 0).sum();
        stats.put("totalDurationMinutes", totalDuration);
        stats.put("totalIncidents", all.size());

        // Group by type
        Map<String, Integer> byType = all.stream()
                .collect(Collectors.groupingBy(Distraction::getType, Collectors.summingInt(d -> d.getDuration() != null ? d.getDuration() : 0)));
        stats.put("byType", byType);

        // Today's stats
        List<Distraction> today = all.stream().filter(d -> LocalDate.now().equals(d.getDate())).collect(Collectors.toList());
        int todayDuration = today.stream().mapToInt(d -> d.getDuration() != null ? d.getDuration() : 0).sum();
        stats.put("todayDurationMinutes", todayDuration);
        stats.put("todayIncidents", today.size());

        return stats;
    }
}

