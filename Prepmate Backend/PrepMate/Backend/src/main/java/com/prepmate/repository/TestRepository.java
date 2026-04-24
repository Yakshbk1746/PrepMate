package com.prepmate.repository;

import com.prepmate.model.Test;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TestRepository extends JpaRepository<Test, Long> {
    List<Test> findByUserIdOrderByDateDesc(Long userId);
    List<Test> findByUserIdAndType(Long userId, String type);
}
