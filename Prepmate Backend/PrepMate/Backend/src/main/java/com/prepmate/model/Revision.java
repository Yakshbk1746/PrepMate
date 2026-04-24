package com.prepmate.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "revisions")
public class Revision {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String topicName;

    private String subject;
    private Integer intervalDays;
    private LocalDate scheduledDate;
    private LocalDate completedDate;
    private Integer completionCount;
    private String status;
    private Boolean completed;

    @Column(nullable = false)
    private Long userId;

    public Revision() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTopicName() { return topicName; }
    public void setTopicName(String topicName) { this.topicName = topicName; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public Integer getIntervalDays() { return intervalDays; }
    public void setIntervalDays(Integer intervalDays) { this.intervalDays = intervalDays; }
    public LocalDate getScheduledDate() { return scheduledDate; }
    public void setScheduledDate(LocalDate scheduledDate) { this.scheduledDate = scheduledDate; }
    public LocalDate getCompletedDate() { return completedDate; }
    public void setCompletedDate(LocalDate completedDate) { this.completedDate = completedDate; }
    public Integer getCompletionCount() { return completionCount; }
    public void setCompletionCount(Integer completionCount) { this.completionCount = completionCount; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Boolean getCompleted() {
        if (completed != null) {
            return completed;
        }
        return status != null && "completed".equalsIgnoreCase(status);
    }

    public void setCompleted(Boolean completed) {
        this.completed = completed;
        if (completed != null) {
            this.status = completed ? "completed" : "pending";
        }
    }

    @Transient
    @JsonProperty("title")
    public String getTitle() {
        return topicName;
    }

    @JsonProperty("title")
    public void setTitle(String title) {
        this.topicName = title;
    }

    @Transient
    @JsonProperty("time")
    public String getTime() {
        if (intervalDays != null) {
            return intervalDays + "d";
        }
        if (scheduledDate != null) {
            return scheduledDate.toString();
        }
        return null;
    }

    @JsonProperty("time")
    public void setTime(String time) {
        if (time == null || time.isBlank()) {
            return;
        }

        String normalized = time.trim().toLowerCase();
        if (normalized.endsWith("d")) {
            normalized = normalized.substring(0, normalized.length() - 1).trim();
        }

        if (normalized.matches("\\d+")) {
            this.intervalDays = Integer.parseInt(normalized);
        }
    }
}
