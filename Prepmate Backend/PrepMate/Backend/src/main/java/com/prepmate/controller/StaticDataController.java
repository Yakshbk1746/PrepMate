package com.prepmate.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.prepmate.model.Exam;
import com.prepmate.model.Stream;
import com.prepmate.model.Subject;
import com.prepmate.model.Topic;
import com.prepmate.repository.ExamRepository;
import com.prepmate.repository.StreamRepository;
import com.prepmate.repository.SubjectRepository;
import com.prepmate.repository.TopicRepository;

@RestController
@RequestMapping("/static-data")
public class StaticDataController {

    private final ExamRepository examRepository;
    private final StreamRepository streamRepository;
    private final SubjectRepository subjectRepository;
    private final TopicRepository topicRepository;

    public StaticDataController(ExamRepository examRepository, 
                                StreamRepository streamRepository, 
                                SubjectRepository subjectRepository, 
                                TopicRepository topicRepository) {
        this.examRepository = examRepository;
        this.streamRepository = streamRepository;
        this.subjectRepository = subjectRepository;
        this.topicRepository = topicRepository;
    }

    @GetMapping("/exams")
    public List<Exam> getExams() {
        return examRepository.findAll();
    }

    @GetMapping("/exams/{examId}/streams")
    public List<Stream> getStreamsByExam(@PathVariable Long examId) {
        return streamRepository.findByExamId(examId);
    }

    @GetMapping("/streams/{streamId}/subjects")
    public List<Subject> getSubjectsByStream(@PathVariable Long streamId) {
        return subjectRepository.findByStreamId(streamId);
    }

    @GetMapping("/streams/name/{streamName}/subjects")
    public List<Subject> getSubjectsByStreamName(@PathVariable String streamName) {
        String decodedStreamName = streamName.replace("-", "/");
        return subjectRepository.findByStreamName(decodedStreamName);
    }

    @GetMapping("/subjects/{subjectId}/topics")
    public List<Topic> getTopicsBySubject(@PathVariable Long subjectId) {
        try {
            System.out.println("[StaticDataController] Fetching topics for subjectId: " + subjectId);
            List<Topic> topics = topicRepository.findBySubjectId(subjectId);
            System.out.println("[StaticDataController] Found " + topics.size() + " topics for subjectId: " + subjectId);
            return topics;
        } catch (Exception e) {
            System.err.println("[StaticDataController] Error fetching topics for subjectId " + subjectId + ": " + e.getMessage());
            e.printStackTrace();
            return List.of();  // Return empty list on error instead of throwing 500
        }
    }
    
    @GetMapping("/exams/{examId}/streams/{streamId}/subjects")
    public List<Subject> getSubjectsByExamAndStream(@PathVariable Long examId, @PathVariable Long streamId) {
        return subjectRepository.findByExamIdAndStreamId(examId, streamId);
    }

    @GetMapping("/exams/name/{examName}/streams/name/{streamName}/subjects")
    public List<Subject> getSubjectsByExamNameAndStreamName(@PathVariable String examName, @PathVariable String streamName) {
        // Decode the stream name (which may have been encoded)
        String decodedStreamName = streamName.replace("-", "/");
        return subjectRepository.findByStreamName(decodedStreamName);
    }
    
    // --- Static Data ---
    @GetMapping("/signup-config")
    public Map<String, Object> getSignupConfig() {
        try {
            List<Exam> exams = examRepository.findAll();
            Map<String, Object> config = new HashMap<>();
            
            if (exams.isEmpty()) {
                // Return empty config if no exams exist
                config.put("exams", List.of());
                config.put("streams", Map.of());
                return config;
            }
            
            Map<String, List<String>> examStreams = new HashMap<>();
            for (Exam exam : exams) {
                try {
                    List<String> streamNames = streamRepository.findByExamId(exam.getId())
                                                .stream()
                                                .map(Stream::getName)
                                                .toList();
                    examStreams.put(exam.getName(), streamNames);
                } catch (Exception e) {
                    System.err.println("Error fetching streams for exam " + exam.getName() + ": " + e.getMessage());
                    examStreams.put(exam.getName(), List.of());
                }
            }
            
            config.put("exams", exams.stream().map(Exam::getName).toList());
            config.put("streams", examStreams);
            
            return config;
        } catch (Exception e) {
            System.err.println("Error in getSignupConfig: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> errorConfig = new HashMap<>();
            errorConfig.put("exams", List.of());
            errorConfig.put("streams", Map.of());
            return errorConfig;
        }
    }
}
