package com.prepmate.service;

import com.prepmate.model.Flashcard;
import com.prepmate.repository.FlashcardRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class FlashcardService {

    private final FlashcardRepository flashcardRepository;
    public FlashcardService(FlashcardRepository flashcardRepository) {
        this.flashcardRepository = flashcardRepository;
    }


    public List<Flashcard> getAllFlashcards(Long userId) {
        return flashcardRepository.findByUserId(userId);
    }

    public List<Flashcard> getFlashcardsBySubject(Long userId, String subject) {
        return flashcardRepository.findByUserIdAndSubject(userId, subject);
    }

    public List<Flashcard> getFlashcardsByStatus(Long userId, String status) {
        return flashcardRepository.findByUserIdAndStatus(userId, status);
    }

    public Flashcard getFlashcardById(Long id) {
        return flashcardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Flashcard not found with id: " + id));
    }

    public Flashcard createFlashcard(Flashcard flashcard) {
        flashcard.setStatus(normalizeStatus(flashcard.getStatus()));
        return flashcardRepository.save(flashcard);
    }

    public Flashcard updateFlashcard(Long id, Flashcard updated) {
        Flashcard flashcard = getFlashcardById(id);
        if (updated.getSubject() != null) flashcard.setSubject(updated.getSubject());
        if (updated.getFront() != null) flashcard.setFront(updated.getFront());
        if (updated.getBack() != null) flashcard.setBack(updated.getBack());
        if (updated.getStatus() != null) flashcard.setStatus(normalizeStatus(updated.getStatus()));
        return flashcardRepository.save(flashcard);
    }

    public Flashcard updateStatus(Long id, String status) {
        Flashcard flashcard = getFlashcardById(id);
        flashcard.setStatus(normalizeStatus(status));
        return flashcardRepository.save(flashcard);
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) return "New";

        String normalized = status.trim().toLowerCase();
        if ("mastered".equals(normalized)) return "Mastered";
        if ("needs practice".equals(normalized) || "needs_practice".equals(normalized)) return "Needs Practice";
        return "New";
    }

    public void deleteFlashcard(Long id) {
        flashcardRepository.deleteById(id);
    }
}

