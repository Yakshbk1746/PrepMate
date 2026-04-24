package com.prepmate.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "timer_sessions")
public class TimerSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String type;
    private Integer duration;
    private String subject;
    private String label;
    private LocalDate date;
    
    // Analytics
    private Integer questionCount;
    private Double averageTimePerQuestion;

    @Column(nullable = false)
    private Long userId;

    public TimerSession() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Integer getDuration() { return duration; }
    public void setDuration(Integer duration) { this.duration = duration; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    
    public Integer getQuestionCount() { return questionCount; }
    public void setQuestionCount(Integer questionCount) { this.questionCount = questionCount; }
    public Double getAverageTimePerQuestion() { return averageTimePerQuestion; }
    public void setAverageTimePerQuestion(Double averageTimePerQuestion) { this.averageTimePerQuestion = averageTimePerQuestion; }
    
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
}
