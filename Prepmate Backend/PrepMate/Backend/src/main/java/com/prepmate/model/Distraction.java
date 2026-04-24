package com.prepmate.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "distractions")
public class Distraction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private String source;

    private Integer duration;
    private String impact;
    private LocalDate date;
    private String time;

    @Column(nullable = false)
    private Long userId;

    public Distraction() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public Integer getDuration() { return duration; }
    public void setDuration(Integer duration) { this.duration = duration; }
    public String getImpact() { return impact; }
    public void setImpact(String impact) { this.impact = impact; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public String getTime() { return time; }
    public void setTime(String time) { this.time = time; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
}
