package com.prepmate.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "tasks")
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String subject;
    private String duration;
    private String type;
    private String status;
    private LocalDate date;
    private String priority;
    private String startTime;
    private String endTime;

    @Column(nullable = false)
    private Long userId;

    public Task() {}

    public Task(Long id, String title, String subject, String duration, String type,
                String status, LocalDate date, String priority, String startTime, String endTime, Long userId) {
        this.id = id; this.title = title; this.subject = subject; this.duration = duration;
        this.type = type; this.status = status; this.date = date; this.priority = priority;
        this.startTime = startTime;
        this.endTime = endTime;
        this.userId = userId;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getStatus() { return status; }
    public void setStatus(String status) { 
        if ("PENDING".equalsIgnoreCase(status)) {
            this.status = "todo";
        } else if ("COMPLETED".equalsIgnoreCase(status)) {
            this.status = "completed";
        } else {
            this.status = status; 
        }
    }
    
    @Transient
    public Boolean getCompleted() {
        return this.status != null && "completed".equalsIgnoreCase(this.status);
    }

    public void setCompleted(Boolean completed) {
        if (completed == null) {
            return;
        }
        this.status = completed ? "completed" : "todo";
    }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }
    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
}
