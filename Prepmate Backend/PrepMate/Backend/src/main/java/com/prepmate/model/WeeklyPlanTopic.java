package com.prepmate.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "weekly_plan_topics")
public class WeeklyPlanTopic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate weekStartDate;

    private String subject;
    private String topic;
    private String timeFrom;
    private String timeTo;
    private String dayOfWeek;

    @Column(nullable = false)
    private Long userId;

    public WeeklyPlanTopic() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDate getWeekStartDate() { return weekStartDate; }
    public void setWeekStartDate(LocalDate weekStartDate) { this.weekStartDate = weekStartDate; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }
    public String getTimeFrom() { return timeFrom; }
    public void setTimeFrom(String timeFrom) { this.timeFrom = timeFrom; }
    public String getTimeTo() { return timeTo; }
    public void setTimeTo(String timeTo) { this.timeTo = timeTo; }
    public String getDayOfWeek() { return dayOfWeek; }
    public void setDayOfWeek(String dayOfWeek) { this.dayOfWeek = dayOfWeek; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
}
