package com.prepmate.repository;

import com.prepmate.model.Stream;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface StreamRepository extends JpaRepository<Stream, Long> {
    List<Stream> findByExamId(Long examId);
}
