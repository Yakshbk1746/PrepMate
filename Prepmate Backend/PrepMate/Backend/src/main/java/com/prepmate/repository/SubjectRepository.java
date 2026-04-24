package com.prepmate.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.prepmate.model.Subject;

@Repository
public interface SubjectRepository extends JpaRepository<Subject, Long> {
    List<Subject> findByStreamId(Long streamId);
    List<Subject> findByStreamName(String streamName);
    
    // Find subjects by exam and stream
    @org.springframework.data.jpa.repository.Query(
        "SELECT s FROM Subject s " +
        "WHERE s.stream.exam.id = :examId AND s.stream.id = :streamId"
    )
    List<Subject> findByExamIdAndStreamId(Long examId, Long streamId);
}
