package com.prepmate.service;

import com.prepmate.model.TimerSession;
import com.prepmate.repository.TimerSessionRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;

@Service
public class TimerSessionService {

    private final TimerSessionRepository timerSessionRepository;
    public TimerSessionService(TimerSessionRepository timerSessionRepository) {
        this.timerSessionRepository = timerSessionRepository;
    }


    public List<TimerSession> getAllSessions(Long userId) {
        return timerSessionRepository.findByUserIdOrderByDateDesc(userId);
    }

    public List<TimerSession> getSessionsByDate(Long userId, LocalDate date) {
        return timerSessionRepository.findByUserIdAndDate(userId, date);
    }

    public TimerSession logSession(TimerSession session) {
        if (session.getDate() == null) session.setDate(LocalDate.now());
        return timerSessionRepository.save(session);
    }

    public void deleteSession(Long id) {
        timerSessionRepository.deleteById(id);
    }
}

