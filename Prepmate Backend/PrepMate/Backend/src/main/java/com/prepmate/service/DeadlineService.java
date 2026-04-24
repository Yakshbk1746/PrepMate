package com.prepmate.service;

import com.prepmate.model.Deadline;
import com.prepmate.repository.DeadlineRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class DeadlineService {

    private final DeadlineRepository deadlineRepository;
    public DeadlineService(DeadlineRepository deadlineRepository) {
        this.deadlineRepository = deadlineRepository;
    }


    public List<Deadline> getAllDeadlines(Long userId) {
        return deadlineRepository.findByUserIdOrderByDateAsc(userId);
    }

    public List<Deadline> getActiveDeadlines(Long userId) {
        return deadlineRepository.findByUserIdAndCompleted(userId, false);
    }

    public Deadline getDeadlineById(Long id) {
        return deadlineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Deadline not found with id: " + id));
    }

    public Deadline createDeadline(Deadline deadline) {
        if (deadline.getCompleted() == null) deadline.setCompleted(false);
        return deadlineRepository.save(deadline);
    }

    public Deadline updateDeadline(Long id, Deadline updated) {
        Deadline deadline = getDeadlineById(id);
        if (updated.getTitle() != null) deadline.setTitle(updated.getTitle());
        if (updated.getDate() != null) deadline.setDate(updated.getDate());
        if (updated.getType() != null) deadline.setType(updated.getType());
        if (updated.getPriority() != null) deadline.setPriority(updated.getPriority());
        if (updated.getCompleted() != null) deadline.setCompleted(updated.getCompleted());
        return deadlineRepository.save(deadline);
    }

    public Deadline toggleComplete(Long id) {
        Deadline deadline = getDeadlineById(id);
        deadline.setCompleted(!deadline.getCompleted());
        return deadlineRepository.save(deadline);
    }

    public void deleteDeadline(Long id) {
        deadlineRepository.deleteById(id);
    }
}

