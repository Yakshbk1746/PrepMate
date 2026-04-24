package com.prepmate.service;

import com.prepmate.model.Task;
import com.prepmate.repository.TaskRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }


    public List<Task> getAllTasks(Long userId) {
        return taskRepository.findByUserId(userId);
    }

    public List<Task> getTasksByDate(Long userId, LocalDate date) {
        return taskRepository.findByUserIdAndDate(userId, date);
    }

    public List<Task> getTasksByStatus(Long userId, String status) {
        return taskRepository.findByUserIdAndStatus(userId, status);
    }

    public Task getTaskById(Long userId, Long id) {
        return taskRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Task not found with id: " + id + " for user: " + userId));
    }

    public Task createTask(Task task) {
        if (task.getDate() == null) task.setDate(LocalDate.now());
        if (task.getStatus() == null) task.setStatus("todo");
        return taskRepository.save(task);
    }

    public Task updateTask(Long userId, Long id, Task updated) {
        Task task = getTaskById(userId, id);
        if (updated.getTitle() != null) task.setTitle(updated.getTitle());
        if (updated.getSubject() != null) task.setSubject(updated.getSubject());
        if (updated.getDuration() != null) task.setDuration(updated.getDuration());
        if (updated.getType() != null) task.setType(updated.getType());
        if (updated.getStatus() != null) task.setStatus(updated.getStatus());
        if (updated.getDate() != null) task.setDate(updated.getDate());
        if (updated.getPriority() != null) task.setPriority(updated.getPriority());
        if (updated.getStartTime() != null) task.setStartTime(updated.getStartTime());
        if (updated.getEndTime() != null) task.setEndTime(updated.getEndTime());
        return taskRepository.save(task);
    }

    public Task updateTask(Long id, Task updated) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found with id: " + id));
        if (updated.getTitle() != null) task.setTitle(updated.getTitle());
        if (updated.getSubject() != null) task.setSubject(updated.getSubject());
        if (updated.getDuration() != null) task.setDuration(updated.getDuration());
        if (updated.getType() != null) task.setType(updated.getType());
        if (updated.getStatus() != null) task.setStatus(updated.getStatus());
        if (updated.getDate() != null) task.setDate(updated.getDate());
        if (updated.getPriority() != null) task.setPriority(updated.getPriority());
        if (updated.getStartTime() != null) task.setStartTime(updated.getStartTime());
        if (updated.getEndTime() != null) task.setEndTime(updated.getEndTime());
        if (updated.getUserId() != null) task.setUserId(updated.getUserId());
        return taskRepository.save(task);
    }

    public Task updateTaskStatus(Long userId, Long id, String status) {
        Task task = getTaskById(userId, id);
        task.setStatus(status);
        return taskRepository.save(task);
    }

    public void deleteTask(Long userId, Long id) {
        long deletedCount = taskRepository.deleteByIdAndUserId(id, userId);
        if (deletedCount == 0) {
            throw new RuntimeException("Task not found with id: " + id + " for user: " + userId);
        }
    }

    public void deleteTask(Long id) {
        if (!taskRepository.existsById(id)) {
            throw new RuntimeException("Task not found with id: " + id);
        }
        taskRepository.deleteById(id);
    }
}

