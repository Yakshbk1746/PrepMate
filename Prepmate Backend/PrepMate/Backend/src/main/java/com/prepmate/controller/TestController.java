package com.prepmate.controller;

import com.prepmate.model.Test;
import com.prepmate.service.TestService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/tests")
public class TestController {

    private final TestService testService;
    public TestController(TestService testService) {
        this.testService = testService;
    }


    @GetMapping
    public ResponseEntity<List<Test>> getAllTests(@RequestParam Long userId) {
        return ResponseEntity.ok(testService.getAllTests(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Test> getTestById(@PathVariable Long id) {
        return ResponseEntity.ok(testService.getTestById(id));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(@RequestParam Long userId) {
        return ResponseEntity.ok(testService.getTestStats(userId));
    }

    @PostMapping
    public ResponseEntity<Test> createTest(@RequestParam Long userId, @RequestBody Test test) {
        test.setUserId(userId);
        return ResponseEntity.ok(testService.createTest(test));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Test> updateTest(@PathVariable Long id, @RequestBody Test test) {
        return ResponseEntity.ok(testService.updateTest(id, test));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTest(@PathVariable Long id) {
        testService.deleteTest(id);
        return ResponseEntity.noContent().build();
    }
}

