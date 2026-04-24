package com.prepmate.service;

import com.prepmate.model.Goal;
import com.prepmate.repository.GoalRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class GoalService {

    private final GoalRepository goalRepository;
    public GoalService(GoalRepository goalRepository) {
        this.goalRepository = goalRepository;
    }


    public List<Goal> getAllGoals(Long userId) {
        return goalRepository.findByUserId(userId);
    }

    public List<Goal> getGoalsByType(Long userId, String type) {
        return goalRepository.findByUserIdAndType(userId, type);
    }

    public Goal getGoalById(Long id) {
        return goalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Goal not found with id: " + id));
    }

    public Goal createGoal(Goal goal) {
        if (goal.getCompleted() == null) goal.setCompleted(false);
        if (goal.getProgress() == null) goal.setProgress(goal.getCompleted() ? 100 : 0);
        return goalRepository.save(goal);
    }

    public Goal updateGoal(Long id, Goal updated) {
        Goal goal = getGoalById(id);
        if (updated.getType() != null) goal.setType(updated.getType());
        if (updated.getTitle() != null) goal.setTitle(updated.getTitle());
        if (updated.getDeadline() != null) goal.setDeadline(updated.getDeadline());
        if (updated.getCompleted() != null) goal.setCompleted(updated.getCompleted());
        if (updated.getProgress() != null) goal.setProgress(updated.getProgress());
        return goalRepository.save(goal);
    }

    public void deleteGoal(Long id) {
        goalRepository.deleteById(id);
    }
}

