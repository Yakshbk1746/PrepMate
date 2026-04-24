package com.prepmate.service;

import com.prepmate.model.WellbeingLog;
import com.prepmate.repository.WellbeingLogRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;

@Service
public class WellbeingService {

    private final WellbeingLogRepository wellbeingLogRepository;
    public WellbeingService(WellbeingLogRepository wellbeingLogRepository) {
        this.wellbeingLogRepository = wellbeingLogRepository;
    }


    public WellbeingLog logOrUpdate(WellbeingLog log) {
        if (log.getDate() == null) log.setDate(LocalDate.now());
        return wellbeingLogRepository.findByUserIdAndDate(log.getUserId(), log.getDate())
                .map(existing -> {
                    if (log.getSleep() != null) existing.setSleep(log.getSleep());
                    if (log.getWater() != null) existing.setWater(log.getWater());
                    if (log.getExercise() != null) existing.setExercise(log.getExercise());
                    return wellbeingLogRepository.save(existing);
                })
                .orElseGet(() -> wellbeingLogRepository.save(log));
    }

    public WellbeingLog getToday(Long userId) {
        return wellbeingLogRepository.findByUserIdAndDate(userId, LocalDate.now()).orElse(null);
    }

    public List<WellbeingLog> getWeeklyData(Long userId) {
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(6);
        return wellbeingLogRepository.findByUserIdAndDateBetween(userId, start, end);
    }

    public List<WellbeingLog> getAllLogs(Long userId) {
        return wellbeingLogRepository.findByUserIdOrderByDateDesc(userId);
    }
}

