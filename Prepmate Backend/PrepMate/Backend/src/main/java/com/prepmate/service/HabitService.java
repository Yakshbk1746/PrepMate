package com.prepmate.service;

import com.prepmate.model.Habit;
import com.prepmate.repository.HabitRepository;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class HabitService {

    private final HabitRepository habitRepository;
    private final ObjectMapper objectMapper;
    public HabitService(HabitRepository habitRepository, ObjectMapper objectMapper) {
        this.habitRepository = habitRepository;
        this.objectMapper = objectMapper;
    }


    public List<Habit> getAllHabits(Long userId) {
        return habitRepository.findByUserId(userId);
    }

    public Habit getHabitById(Long id) {
        return habitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Habit not found with id: " + id));
    }

    public Habit createHabit(Habit habit) {
        if (habit.getStreak() == null) habit.setStreak(0);
        if (habit.getLongestStreak() == null) habit.setLongestStreak(0);
        if (habit.getCompletedDates() == null) habit.setCompletedDates("[]");
        if (habit.getFrequency() == null || habit.getFrequency().isBlank()) habit.setFrequency("daily");
        return habitRepository.save(habit);
    }

    public Habit toggleCompletion(Long id, String dateStr) {
        Habit habit = getHabitById(id);
        try {
            List<String> dates = objectMapper.readValue(
                    habit.getCompletedDates() != null ? habit.getCompletedDates() : "[]",
                    new TypeReference<List<String>>() {}
            );

            if (dates.contains(dateStr)) {
                dates.remove(dateStr);
            } else {
                dates.add(dateStr);
            }

            habit.setCompletedDates(objectMapper.writeValueAsString(dates));

            // Recalculate streak
            int streak = 0;
            LocalDate checkDate = LocalDate.now();
            while (dates.contains(checkDate.toString())) {
                streak++;
                checkDate = checkDate.minusDays(1);
            }
            habit.setStreak(streak);
            if (streak > habit.getLongestStreak()) {
                habit.setLongestStreak(streak);
            }

            return habitRepository.save(habit);
        } catch (Exception e) {
            throw new RuntimeException("Failed to toggle habit completion", e);
        }
    }

    public Habit updateHabit(Long id, Habit updated) {
        Habit habit = getHabitById(id);
        if (updated.getName() != null) habit.setName(updated.getName());
        if (updated.getFrequency() != null) habit.setFrequency(updated.getFrequency());
        if (updated.getCompletedDates() != null) habit.setCompletedDates(updated.getCompletedDates());
        if (updated.getStreak() != null) habit.setStreak(updated.getStreak());
        if (updated.getLongestStreak() != null) habit.setLongestStreak(updated.getLongestStreak());
        return habitRepository.save(habit);
    }

    public void deleteHabit(Long id) {
        habitRepository.deleteById(id);
    }
}

