package com.prepmate.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "subjects")
public class Subject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String color;
    private String icon;

    // We can link subjects to specific exams or globally. For PrepMate's flexible UI, usually subjects belong to an Exam or are global.
    // To keep it simple based on the frontend, let's link it to an Exam or leave it standalone if needed.
    // For now, let's link to Exam so "GATE" subjects are distinct from "UPSC" subjects.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stream_id")
    @JsonIgnore
    private Stream stream;

    public Subject() {}

    public Subject(String name, String color, String icon, Stream stream) {
        this.name = name;
        this.color = color;
        this.icon = icon;
        this.stream = stream;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
    public Stream getStream() { return stream; }
    public void setStream(Stream stream) { this.stream = stream; }
}
