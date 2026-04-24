package com.prepmate.model;

import jakarta.persistence.*;

@Entity
@Table(name = "habits")
public class Habit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private Integer streak;
    private Integer longestStreak;
    private String frequency;

    @Column(columnDefinition = "TEXT")
    private String completedDates;

    @Column(nullable = false)
    private Long userId;

    public Habit() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Integer getStreak() { return streak; }
    public void setStreak(Integer streak) { this.streak = streak; }
    public Integer getLongestStreak() { return longestStreak; }
    public void setLongestStreak(Integer longestStreak) { this.longestStreak = longestStreak; }
    public String getFrequency() { return frequency; }
    public void setFrequency(String frequency) { this.frequency = frequency; }
    public String getCompletedDates() { return completedDates; }
    public void setCompletedDates(String completedDates) { this.completedDates = completedDates; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
}
