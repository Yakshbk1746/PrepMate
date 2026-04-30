package com.prepmate.service;

import com.prepmate.model.User;
import com.prepmate.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }


    public User syncUser(User user) {
        System.out.println("[UserService.syncUser] Syncing user with firebaseUid: " + user.getFirebaseUid());

        String incomingUid = user.getFirebaseUid() != null ? user.getFirebaseUid().trim() : "";
        String incomingEmail = user.getEmail() != null ? user.getEmail().trim() : "";

        if (incomingUid.isEmpty()) {
            throw new RuntimeException("firebaseUid is required for sync");
        }

        if (!incomingEmail.isEmpty()) {
            user.setEmail(incomingEmail);
        }

        Optional<User> existingCandidate = userRepository.findByFirebaseUid(incomingUid);
        if (existingCandidate.isEmpty() && !incomingEmail.isEmpty()) {
            // Handle migrated/legacy rows that were created without the current Firebase UID.
            existingCandidate = userRepository.findByEmail(incomingEmail);
        }

        return existingCandidate
                .map(existing -> {
                    System.out.println("[UserService.syncUser] Found existing user with id: " + existing.getId());

                    if (existing.getFirebaseUid() == null || !existing.getFirebaseUid().equals(incomingUid)) {
                        existing.setFirebaseUid(incomingUid);
                    }
                    
                    if (user.getFullName() != null && !user.getFullName().trim().isEmpty()) {
                        System.out.println("[UserService.syncUser] Updating fullName to: " + user.getFullName());
                        existing.setFullName(user.getFullName());
                    }
                    if (user.getEmail() != null && !user.getEmail().trim().isEmpty()) {
                        existing.setEmail(user.getEmail());
                    }
                    if (user.getPhotoUrl() != null && !user.getPhotoUrl().trim().isEmpty()) {
                        existing.setPhotoUrl(user.getPhotoUrl());
                    }
                    if (user.getExam() != null && !user.getExam().trim().isEmpty()) {
                        System.out.println("[UserService.syncUser] Setting exam to: " + user.getExam());
                        existing.setExam(user.getExam());
                    }
                    if (user.getStream() != null && !user.getStream().trim().isEmpty()) {
                        System.out.println("[UserService.syncUser] Setting stream to: " + user.getStream());
                        existing.setStream(user.getStream());
                    }
                    if (user.getExamDate() != null) {
                        existing.setExamDate(user.getExamDate());
                    }
                    
                    User saved = userRepository.save(existing);
                    System.out.println("[UserService.syncUser] User updated successfully");
                    return saved;
                })
                .orElseGet(() -> {
                    System.out.println("[UserService.syncUser] No existing user found, creating new user");
                    user.setFirebaseUid(incomingUid);
                    User newUser = userRepository.save(user);
                    System.out.println("[UserService.syncUser] New user created with id: " + newUser.getId());
                    return newUser;
                });
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }

    public User getUserByFirebaseUid(String uid) {
        return userRepository.findByFirebaseUid(uid)
                .orElseThrow(() -> new RuntimeException("User not found with uid: " + uid));
    }

    public Optional<User> findUserByFirebaseUid(String uid) {
        if (uid == null || uid.trim().isEmpty()) {
            return Optional.empty();
        }
        return userRepository.findByFirebaseUid(uid.trim());
    }

    public User updateUser(Long id, User updated) {
        User user = getUserById(id);
        if (updated.getFullName() != null && !updated.getFullName().trim().isEmpty()) user.setFullName(updated.getFullName());
        if (updated.getPhotoUrl() != null) {
            String nextPhotoUrl = updated.getPhotoUrl().trim();
            user.setPhotoUrl(nextPhotoUrl.isEmpty() ? null : nextPhotoUrl);
        }
        if (updated.getExam() != null && !updated.getExam().trim().isEmpty()) user.setExam(updated.getExam());
        if (updated.getStream() != null && !updated.getStream().trim().isEmpty()) user.setStream(updated.getStream());
        if (updated.getExamDate() != null) user.setExamDate(updated.getExamDate());
        if (updated.getTargetRank() != null) user.setTargetRank(updated.getTargetRank());
        if (updated.getPomodoroTime() != null) user.setPomodoroTime(updated.getPomodoroTime());
        if (updated.getWeekStart() != null) user.setWeekStart(updated.getWeekStart());
        if (updated.getTimeFormat() != null) user.setTimeFormat(updated.getTimeFormat());
        if (updated.getTheme() != null) user.setTheme(updated.getTheme());
        if (updated.getBrowserNotifs() != null) user.setBrowserNotifs(updated.getBrowserNotifs());
        if (updated.getTimerSound() != null) user.setTimerSound(updated.getTimerSound());
        if (updated.getBreakReminders() != null) user.setBreakReminders(updated.getBreakReminders());
        return userRepository.save(user);
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
}

