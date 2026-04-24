package com.prepmate.service;

import com.prepmate.model.Test;
import com.prepmate.repository.TestRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class TestService {

    private final TestRepository testRepository;
    public TestService(TestRepository testRepository) {
        this.testRepository = testRepository;
    }


    public List<Test> getAllTests(Long userId) {
        return testRepository.findByUserIdOrderByDateDesc(userId);
    }

    public Test getTestById(Long id) {
        return testRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Test not found with id: " + id));
    }

    public Test createTest(Test test) {
        if (test.getDate() == null) test.setDate(LocalDate.now());
        return testRepository.save(test);
    }

    public Test updateTest(Long id, Test updated) {
        Test test = getTestById(id);
        if (updated.getName() != null) test.setName(updated.getName());
        if (updated.getType() != null) test.setType(updated.getType());
        if (updated.getSubjects() != null) test.setSubjects(updated.getSubjects());
        if (updated.getTopics() != null) test.setTopics(updated.getTopics());
        if (updated.getScore() != null) test.setScore(updated.getScore());
        if (updated.getTotal() != null) test.setTotal(updated.getTotal());
        if (updated.getDuration() != null) test.setDuration(updated.getDuration());
        if (updated.getErrors() != null) test.setErrors(updated.getErrors());
        if (updated.getDate() != null) test.setDate(updated.getDate());
        return testRepository.save(test);
    }

    public void deleteTest(Long id) {
        testRepository.deleteById(id);
    }

    public Map<String, Object> getTestStats(Long userId) {
        List<Test> tests = testRepository.findByUserIdOrderByDateDesc(userId);
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalTests", tests.size());

        if (!tests.isEmpty()) {
            double avgScore = tests.stream()
                    .filter(t -> t.getScore() != null && t.getTotal() != null && t.getTotal() > 0)
                    .mapToDouble(t -> (t.getScore() * 100.0) / t.getTotal())
                    .average()
                    .orElse(0.0);
            stats.put("averageScore", Math.round(avgScore * 10.0) / 10.0);

            int totalDuration = tests.stream()
                    .filter(t -> t.getDuration() != null)
                    .mapToInt(Test::getDuration)
                    .sum();
            stats.put("totalDurationMinutes", totalDuration);
        } else {
            stats.put("averageScore", 0);
            stats.put("totalDurationMinutes", 0);
        }

        return stats;
    }
}

