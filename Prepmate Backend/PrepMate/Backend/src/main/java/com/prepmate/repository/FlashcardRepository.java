package com.prepmate.repository;

import com.prepmate.model.Flashcard;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FlashcardRepository extends JpaRepository<Flashcard, Long> {
    List<Flashcard> findByUserId(Long userId);
    List<Flashcard> findByUserIdAndSubject(Long userId, String subject);
    List<Flashcard> findByUserIdAndStatus(Long userId, String status);
}
