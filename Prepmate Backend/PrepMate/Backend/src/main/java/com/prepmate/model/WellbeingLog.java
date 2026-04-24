package com.prepmate.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "wellbeing_logs")
public class WellbeingLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String sleep;
    private String water;
    private String exercise;
    private LocalDate date;

    @Column(nullable = false)
    private Long userId;

    public WellbeingLog() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getSleep() { return sleep; }
    public void setSleep(String sleep) { this.sleep = sleep; }
    public String getWater() { return water; }
    public void setWater(String water) { this.water = water; }
    public String getExercise() { return exercise; }
    public void setExercise(String exercise) { this.exercise = exercise; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
}
