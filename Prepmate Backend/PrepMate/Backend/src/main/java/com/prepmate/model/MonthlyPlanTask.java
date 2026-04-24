package com.prepmate.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Entity
@Table(name = "monthly_plan_tasks")
public class MonthlyPlanTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer month;

    @Column(nullable = false)
    private Integer year;

    private Integer weekNumber;
    private String subjectId;
    private String topic;
    private String status;

    @Column(nullable = false)
    private Long userId;

    public MonthlyPlanTask() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Integer getMonth() { return month; }
    public void setMonth(Integer month) { this.month = month; }
    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }
    public Integer getWeekNumber() { return weekNumber; }
    public void setWeekNumber(Integer weekNumber) { this.weekNumber = weekNumber; }
    public String getSubjectId() { return subjectId; }
    public void setSubjectId(String subjectId) { this.subjectId = subjectId; }
    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    @JsonProperty("subject")
    public String getSubject() { return subjectId; }

    @JsonProperty("subject")
    public void setSubject(String subject) { this.subjectId = subject; }

    @JsonProperty("weekId")
    public Integer getWeekId() { return weekNumber; }

    @JsonProperty("weekId")
    public void setWeekId(Integer weekId) { this.weekNumber = weekId; }

    @JsonProperty("topics")
    public List<String> getTopics() {
        if (topic == null || topic.isBlank()) {
            return Collections.emptyList();
        }
        return Arrays.stream(topic.split("\\\\|\\\\|\\\\|"))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .collect(Collectors.toList());
    }

    @JsonProperty("topics")
    public void setTopics(List<String> topics) {
        if (topics == null || topics.isEmpty()) {
            this.topic = null;
            return;
        }

        this.topic = topics.stream()
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .collect(Collectors.joining("|||"));
    }
}
