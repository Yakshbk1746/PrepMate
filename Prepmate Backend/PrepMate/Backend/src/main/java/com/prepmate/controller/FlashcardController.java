package com.prepmate.controller;

import com.prepmate.model.Flashcard;
import com.prepmate.service.FlashcardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/flashcards")
public class FlashcardController {

    private final FlashcardService flashcardService;
    public FlashcardController(FlashcardService flashcardService) {
        this.flashcardService = flashcardService;
    }


    @GetMapping
    public ResponseEntity<List<Flashcard>> getAllFlashcards(@RequestParam Long userId) {
        return ResponseEntity.ok(flashcardService.getAllFlashcards(userId));
    }

    @GetMapping("/subject/{subject}")
    public ResponseEntity<List<Flashcard>> getBySubject(@RequestParam Long userId, @PathVariable String subject) {
        return ResponseEntity.ok(flashcardService.getFlashcardsBySubject(userId, subject));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Flashcard> getFlashcardById(@PathVariable Long id) {
        return ResponseEntity.ok(flashcardService.getFlashcardById(id));
    }

    @PostMapping
    public ResponseEntity<Flashcard> createFlashcard(@RequestParam Long userId, @RequestBody Flashcard flashcard) {
        flashcard.setUserId(userId);
        return ResponseEntity.ok(flashcardService.createFlashcard(flashcard));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Flashcard> updateFlashcard(@PathVariable Long id, @RequestBody Flashcard flashcard) {
        return ResponseEntity.ok(flashcardService.updateFlashcard(id, flashcard));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Flashcard> updateStatus(@PathVariable Long id, @RequestParam String status) {
        return ResponseEntity.ok(flashcardService.updateStatus(id, status));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFlashcard(@PathVariable Long id) {
        flashcardService.deleteFlashcard(id);
        return ResponseEntity.noContent().build();
    }
}

