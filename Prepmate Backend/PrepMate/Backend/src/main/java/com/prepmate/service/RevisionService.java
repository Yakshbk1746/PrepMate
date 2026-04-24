package com.prepmate.service;

import com.prepmate.model.Revision;
import com.prepmate.repository.RevisionRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

@Service
public class RevisionService {

    private final RevisionRepository revisionRepository;
    public RevisionService(RevisionRepository revisionRepository) {
        this.revisionRepository = revisionRepository;
    }


    // Spaced repetition intervals in days (matching frontend revisionService.js)
    private static final List<Integer> INTERVALS = Arrays.asList(1, 3, 7, 14, 30, 60, 90);

    public List<Revision> getAllRevisions(Long userId) {
        return revisionRepository.findByUserIdOrderByScheduledDateAsc(userId);
    }

    public List<Revision> getUpcomingRevisions(Long userId) {
        return revisionRepository.findByUserIdAndScheduledDateLessThanEqual(userId, LocalDate.now().plusDays(7));
    }

    public Revision getRevisionById(Long id) {
        return revisionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Revision not found with id: " + id));
    }

    public Revision createRevision(Revision revision) {
        if (revision.getCompletionCount() == null) revision.setCompletionCount(0);
        if (revision.getIntervalDays() == null) revision.setIntervalDays(INTERVALS.get(0));
        if (revision.getScheduledDate() == null) revision.setScheduledDate(LocalDate.now().plusDays(INTERVALS.get(0)));
        if (revision.getStatus() == null) revision.setStatus("upcoming");
        if (revision.getCompleted() == null) revision.setCompleted(false);
        return revisionRepository.save(revision);
    }

    public Revision markComplete(Long id) {
        Revision revision = getRevisionById(id);
        boolean isCompleted = revision.getCompleted() != null && revision.getCompleted();

        if (!isCompleted) {
            revision.setCompleted(true);
            revision.setCompletedDate(LocalDate.now());
            revision.setCompletionCount(revision.getCompletionCount() + 1);

            // Calculate next interval using spaced repetition
            int nextIntervalIndex = Math.min(revision.getCompletionCount(), INTERVALS.size() - 1);
            int nextInterval = INTERVALS.get(nextIntervalIndex);
            revision.setIntervalDays(nextInterval);
            revision.setScheduledDate(LocalDate.now().plusDays(nextInterval));
            revision.setStatus("upcoming");
        } else {
            // Undo completion
            revision.setCompleted(false);
            revision.setCompletionCount(Math.max(0, revision.getCompletionCount() - 1));
            revision.setScheduledDate(LocalDate.now()); // Revert to today so it is due immediately
            revision.setStatus("upcoming");
        }

        return revisionRepository.save(revision);
    }

    public Revision updateRevision(Long id, Revision updated) {
        Revision revision = getRevisionById(id);
        if (updated.getTopicName() != null) revision.setTopicName(updated.getTopicName());
        if (updated.getSubject() != null) revision.setSubject(updated.getSubject());
        if (updated.getIntervalDays() != null) revision.setIntervalDays(updated.getIntervalDays());
        if (updated.getScheduledDate() != null) revision.setScheduledDate(updated.getScheduledDate());
        if (updated.getStatus() != null) revision.setStatus(updated.getStatus());
        return revisionRepository.save(revision);
    }

    public void deleteRevision(Long id) {
        revisionRepository.deleteById(id);
    }
}

