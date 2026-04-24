package com.prepmate.controller;

import com.prepmate.model.Revision;
import com.prepmate.service.RevisionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/revisions")
public class RevisionController {

    private final RevisionService revisionService;
    public RevisionController(RevisionService revisionService) {
        this.revisionService = revisionService;
    }


    @GetMapping
    public ResponseEntity<List<Revision>> getAllRevisions(@RequestParam Long userId) {
        return ResponseEntity.ok(revisionService.getAllRevisions(userId));
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<Revision>> getUpcomingRevisions(@RequestParam Long userId) {
        return ResponseEntity.ok(revisionService.getUpcomingRevisions(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Revision> getRevisionById(@PathVariable Long id) {
        return ResponseEntity.ok(revisionService.getRevisionById(id));
    }

    @PostMapping
    public ResponseEntity<Revision> createRevision(@RequestParam Long userId, @RequestBody Revision revision) {
        revision.setUserId(userId);
        return ResponseEntity.ok(revisionService.createRevision(revision));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Revision> updateRevision(@PathVariable Long id, @RequestBody Revision revision) {
        return ResponseEntity.ok(revisionService.updateRevision(id, revision));
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<Revision> markComplete(@PathVariable Long id) {
        return ResponseEntity.ok(revisionService.markComplete(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRevision(@PathVariable Long id) {
        revisionService.deleteRevision(id);
        return ResponseEntity.noContent().build();
    }
}

