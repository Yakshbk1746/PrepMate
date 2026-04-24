package com.prepmate.service;

import com.prepmate.model.Reflection;
import com.prepmate.repository.ReflectionRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReflectionService {

    private final ReflectionRepository reflectionRepository;
    public ReflectionService(ReflectionRepository reflectionRepository) {
        this.reflectionRepository = reflectionRepository;
    }


    public List<Reflection> getAllReflections(Long userId) {
        return reflectionRepository.findByUserIdOrderByDateDesc(userId);
    }

    public Reflection getReflectionById(Long id) {
        return reflectionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reflection not found with id: " + id));
    }

    public Reflection createReflection(Reflection reflection) {
        if (reflection.getDate() == null) reflection.setDate(LocalDate.now());
        return reflectionRepository.save(reflection);
    }

    public Reflection updateReflection(Long id, Reflection updated) {
        Reflection reflection = getReflectionById(id);
        if (updated.getMood() != null) reflection.setMood(updated.getMood());
        if (updated.getStudyHours() != null) reflection.setStudyHours(updated.getStudyHours());
        if (updated.getEnergyLevel() != null) reflection.setEnergyLevel(updated.getEnergyLevel());
        if (updated.getWentWell() != null) reflection.setWentWell(updated.getWentWell());
        if (updated.getToImprove() != null) reflection.setToImprove(updated.getToImprove());
        if (updated.getTomorrowPlan() != null) reflection.setTomorrowPlan(updated.getTomorrowPlan());
        return reflectionRepository.save(reflection);
    }

    public void deleteReflection(Long id) {
        reflectionRepository.deleteById(id);
    }

    public Map<String, Object> getMonthlyStats(Long userId, int year, int month) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());
        List<Reflection> entries = reflectionRepository.findByUserIdAndDateBetween(userId, start, end);

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalEntries", entries.size());

        if (!entries.isEmpty()) {
            double avgStudyHours = entries.stream()
                    .filter(r -> r.getStudyHours() != null)
                    .mapToDouble(Reflection::getStudyHours)
                    .average().orElse(0);
            double avgEnergy = entries.stream()
                    .filter(r -> r.getEnergyLevel() != null)
                    .mapToDouble(Reflection::getEnergyLevel)
                    .average().orElse(0);
            stats.put("avgStudyHours", Math.round(avgStudyHours * 10.0) / 10.0);
            stats.put("avgEnergy", Math.round(avgEnergy * 10.0) / 10.0);
        } else {
            stats.put("avgStudyHours", 0);
            stats.put("avgEnergy", 0);
        }

        return stats;
    }
}

