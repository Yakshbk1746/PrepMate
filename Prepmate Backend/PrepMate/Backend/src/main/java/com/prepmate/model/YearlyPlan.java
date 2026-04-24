package com.prepmate.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

@Entity
@Table(name = "yearly_plans")
public class YearlyPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer year;

    private String subjectId;
    private String topic;
    private Double startMonth;
    private Double endMonth;
    private Integer progress;

    @Column(nullable = false)
    private Long userId;

    public YearlyPlan() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }
    public String getSubjectId() { return subjectId; }
    public void setSubjectId(String subjectId) { this.subjectId = subjectId; }
    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }
    public Double getStartMonth() { return startMonth; }
    public void setStartMonth(Double startMonth) { this.startMonth = startMonth; }
    public Double getEndMonth() { return endMonth; }
    public void setEndMonth(Double endMonth) { this.endMonth = endMonth; }
    public Integer getProgress() { return progress; }
    public void setProgress(Integer progress) { this.progress = progress; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    @JsonProperty("category")
    public String getCategory() { return topic; }

    @JsonProperty("category")
    public void setCategory(String category) { this.topic = category; }

    @JsonProperty("subject")
    public String getSubject() { return subjectId; }

    @JsonProperty("subject")
    public void setSubject(String subject) { this.subjectId = subject; }
}
