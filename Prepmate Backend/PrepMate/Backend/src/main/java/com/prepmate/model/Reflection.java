package com.prepmate.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "reflections")
public class Reflection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String mood;
    private Double studyHours;
    private Double energyLevel;

    @Column(columnDefinition = "TEXT")
    private String wentWell;

    @Column(columnDefinition = "TEXT")
    private String toImprove;

    @Column(columnDefinition = "TEXT")
    private String tomorrowPlan;

    private LocalDate date;

    @Column(nullable = false)
    private Long userId;

    public Reflection() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getMood() { return mood; }
    public void setMood(String mood) { this.mood = mood; }
    public Double getStudyHours() { return studyHours; }
    public void setStudyHours(Double studyHours) { this.studyHours = studyHours; }
    public Double getEnergyLevel() { return energyLevel; }
    public void setEnergyLevel(Double energyLevel) { this.energyLevel = energyLevel; }
    public String getWentWell() { return wentWell; }
    public void setWentWell(String wentWell) { this.wentWell = wentWell; }
    public String getToImprove() { return toImprove; }
    public void setToImprove(String toImprove) { this.toImprove = toImprove; }
    public String getTomorrowPlan() { return tomorrowPlan; }
    public void setTomorrowPlan(String tomorrowPlan) { this.tomorrowPlan = tomorrowPlan; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
}
