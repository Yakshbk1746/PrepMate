package com.prepmate.repository;

import com.prepmate.model.Deadline;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DeadlineRepository extends JpaRepository<Deadline, Long> {
    List<Deadline> findByUserIdOrderByDateAsc(Long userId);
    List<Deadline> findByUserIdAndCompleted(Long userId, Boolean completed);
}
