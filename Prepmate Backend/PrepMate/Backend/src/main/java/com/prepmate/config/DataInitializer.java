package com.prepmate.config;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.prepmate.model.Exam;
import com.prepmate.model.Stream;
import com.prepmate.model.Subject;
import com.prepmate.model.Topic;
import com.prepmate.repository.ExamRepository;
import com.prepmate.repository.StreamRepository;
import com.prepmate.repository.SubjectRepository;
import com.prepmate.repository.TopicRepository;

@Configuration
public class DataInitializer {

    // Using the hardcoded values from SignUp.jsx
    private static final Map<String, List<String>> EXAM_STREAMS = Map.of(
        "GATE", Arrays.asList("Computer Science (CSE)", "Electronics (ECE)", "Mechanical (ME)", "Civil (CE)", "Electrical (EE)", "Chemical (CH)"),
        "UPSC", Arrays.asList("General Studies", "Engineering Services", "Forest Services"),
        "JEE", Arrays.asList("Engineering (B.Tech)", "Architecture (B.Arch)"),
        "NEET", Arrays.asList("Medical (MBBS)", "Dental (BDS)", "AYUSH"),
        "CAT", Arrays.asList("MBA / PGDM"),
        "SSC", Arrays.asList("General", "Technical"),
        "CUET", Arrays.asList("Science", "Commerce", "Arts / Humanities"),
        "Other", Arrays.asList("General")
    );

    // Using the hardcoded values from TestsPage.jsx and Planners 
    // Example only for GATE / Computer Science to keep it robust
    private static final Map<String, List<String>> CS_SUBJECTS_AND_TOPICS = Map.of(
        "Algorithms", Arrays.asList("Arrays", "Linked Lists", "Trees", "Graphs", "DP", "Greedy", "Backtracking"),
        "Operating Systems", Arrays.asList("Process Mgmt", "CPU Scheduling", "Deadlocks", "Memory Mgmt", "File Systems"),
        "DBMS", Arrays.asList("ER Model", "SQL", "Normalization", "Transactions", "Indexing"),
        "Computer Networks", Arrays.asList("OSI Model", "TCP/IP", "Routing", "Network Security"),
        "TOC", Arrays.asList("Automata", "Grammars", "Turing Machines", "Decidability"),
        "Digital Logic", Arrays.asList("Gates", "Boolean Algebra", "K-Map", "Sequential Circuits"),
        "Aptitude", Arrays.asList("Quant", "Logical", "Verbal")
    );

    @Bean
    public CommandLineRunner loadData(ExamRepository examRepository, 
                                      StreamRepository streamRepository,
                                      SubjectRepository subjectRepository,
                                      TopicRepository topicRepository) {
        return args -> {
            try {
                // Always seed if exams table is empty
                long examCount = examRepository.count();
                System.out.println("Current exam count: " + examCount);
                
                if (examCount == 0) {
                    System.out.println("No exams found. Seeding Exams, Streams, Subjects, and Topics...");

                    // Seed Exams and Streams
                    for (Map.Entry<String, List<String>> entry : EXAM_STREAMS.entrySet()) {
                        Exam exam = new Exam(entry.getKey());
                        Exam savedExam = examRepository.save(exam);
                        System.out.println("Created Exam: " + savedExam.getName() + " (ID: " + savedExam.getId() + ")");
                        
                        for (String streamName : entry.getValue()) {
                            Stream stream = new Stream(streamName, savedExam);
                            Stream savedStream = streamRepository.save(stream);
                            System.out.println("  Created Stream: " + savedStream.getName() + " (ID: " + savedStream.getId() + ")");
                        }
                    }
                    System.out.println("✓ Exams and Streams seeded successfully.");
                }
                
                // Seed Subjects and Topics for GATE CSE if not already done
                long subjectCount = subjectRepository.count();
                System.out.println("Current subject count: " + subjectCount);
                
                if (subjectCount == 0) {
                    System.out.println("No subjects found. Seeding Subjects and Topics...");
                    
                    List<Stream> allStreams = streamRepository.findAll();
                    System.out.println("Available streams: " + allStreams.size());
                    
                    // Find Computer Science (CSE) stream within GATE exam
                    Stream csStream = allStreams.stream()
                            .filter(s -> "Computer Science (CSE)".equals(s.getName()))
                            .findFirst()
                            .orElse(null);
                    
                    if (csStream != null) {
                        System.out.println("Found CSE Stream (ID: " + csStream.getId() + "). Creating subjects...");
                        
                        String[] colors = {"bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-orange-500", "bg-red-500", "bg-teal-500", "bg-gray-500"};
                        String[] icons = {"📐", "⚡", "🧪", "💻", "🤖", "🔌", "🧠"};
                        
                        int i = 0;
                        for (Map.Entry<String, List<String>> subEntry : CS_SUBJECTS_AND_TOPICS.entrySet()) {
                            String subjectName = subEntry.getKey();
                            String color = colors[i % colors.length];
                            String icon = icons[i % icons.length];
                            
                            Subject subject = new Subject(subjectName, color, icon, csStream);
                            Subject savedSubject = subjectRepository.save(subject);
                            System.out.println("  Created Subject: " + savedSubject.getName() + " (ID: " + savedSubject.getId() + ")");
                            
                            for (String topicName : subEntry.getValue()) {
                                Topic topic = new Topic(topicName, savedSubject);
                                topicRepository.save(topic);
                            }
                            i++;
                        }
                        System.out.println("✓ Subjects and Topics seeded successfully.");
                    } else {
                        System.out.println("⚠ Warning: CSE Stream not found. Skipping subject seeding.");
                    }
                } else {
                    System.out.println("✓ Static data already exists. Skipping seeding.");
                }
                
            } catch (Exception e) {
                System.err.println("Error in DataInitializer: " + e.getMessage());
                e.printStackTrace();
            }
        };
    }
}
