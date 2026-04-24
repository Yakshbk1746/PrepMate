package com.prepmate.model;

import jakarta.persistence.*;

@Entity
@Table(name = "streams")
public class Stream {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Exam exam;

    public Stream() {}

    public Stream(String name, Exam exam) {
        this.name = name;
        this.exam = exam;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Exam getExam() { return exam; }
    public void setExam(Exam exam) { this.exam = exam; }
}
