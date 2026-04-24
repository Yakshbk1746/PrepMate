package com.prepmate.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "timetable_events")
public class TimetableEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String startTime;
    private String endTime;
    private String color;
    private LocalDate date;

    @Column(nullable = false)
    private Long userId;

    public TimetableEvent() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }
    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
}
