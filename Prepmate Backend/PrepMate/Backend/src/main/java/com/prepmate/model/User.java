package com.prepmate.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String firebaseUid;

    private String fullName;

    @Column(unique = true)
    private String email;

    private String photoUrl;
    private String exam;
    private String stream;
    private LocalDate examDate;
    private String targetRank;

    @Column(columnDefinition = "TEXT")
    private String pomodoroTime;

    private String weekStart;
    private String timeFormat;
    private String theme;
    private Boolean browserNotifs;
    private Boolean timerSound;
    private Boolean breakReminders;

    public User() {}

    public User(Long id, String firebaseUid, String fullName, String email, String photoUrl,
                String exam, String stream, LocalDate examDate, String targetRank,
                String pomodoroTime, String weekStart, String timeFormat, String theme,
                Boolean browserNotifs, Boolean timerSound, Boolean breakReminders) {
        this.id = id;
        this.firebaseUid = firebaseUid;
        this.fullName = fullName;
        this.email = email;
        this.photoUrl = photoUrl;
        this.exam = exam;
        this.stream = stream;
        this.examDate = examDate;
        this.targetRank = targetRank;
        this.pomodoroTime = pomodoroTime;
        this.weekStart = weekStart;
        this.timeFormat = timeFormat;
        this.theme = theme;
        this.browserNotifs = browserNotifs;
        this.timerSound = timerSound;
        this.breakReminders = breakReminders;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFirebaseUid() { return firebaseUid; }
    public void setFirebaseUid(String firebaseUid) { this.firebaseUid = firebaseUid; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }

    public String getExam() { return exam; }
    public void setExam(String exam) { this.exam = exam; }

    public String getStream() { return stream; }
    public void setStream(String stream) { this.stream = stream; }

    public LocalDate getExamDate() { return examDate; }
    public void setExamDate(LocalDate examDate) { this.examDate = examDate; }

    public String getTargetRank() { return targetRank; }
    public void setTargetRank(String targetRank) { this.targetRank = targetRank; }

    public String getPomodoroTime() { return pomodoroTime; }
    public void setPomodoroTime(String pomodoroTime) { this.pomodoroTime = pomodoroTime; }

    public String getWeekStart() { return weekStart; }
    public void setWeekStart(String weekStart) { this.weekStart = weekStart; }

    public String getTimeFormat() { return timeFormat; }
    public void setTimeFormat(String timeFormat) { this.timeFormat = timeFormat; }

    public String getTheme() { return theme; }
    public void setTheme(String theme) { this.theme = theme; }

    public Boolean getBrowserNotifs() { return browserNotifs; }
    public void setBrowserNotifs(Boolean browserNotifs) { this.browserNotifs = browserNotifs; }

    public Boolean getTimerSound() { return timerSound; }
    public void setTimerSound(Boolean timerSound) { this.timerSound = timerSound; }

    public Boolean getBreakReminders() { return breakReminders; }
    public void setBreakReminders(Boolean breakReminders) { this.breakReminders = breakReminders; }
}
