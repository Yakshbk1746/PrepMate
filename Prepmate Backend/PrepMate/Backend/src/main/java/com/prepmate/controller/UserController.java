package com.prepmate.controller;

import com.prepmate.model.User;
import com.prepmate.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;
    public UserController(UserService userService) {
        this.userService = userService;
    }


    @PostMapping("/sync")
    public ResponseEntity<User> syncUser(@RequestBody User user) {
        System.out.println("[UserController] Received syncUser request with data: " + 
            "firebaseUid=" + user.getFirebaseUid() + 
            ", email=" + user.getEmail() + 
            ", exam=" + user.getExam() + 
            ", stream=" + user.getStream());
        
        try {
            User syncedUser = userService.syncUser(user);
            System.out.println("[UserController] User sync successful: " + syncedUser.getId());
            return ResponseEntity.ok(syncedUser);
        } catch (Exception e) {
            System.err.println("[UserController] Error during syncUser: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @GetMapping("/firebase/{uid}")
    public ResponseEntity<User> getUserByFirebaseUid(@PathVariable String uid) {
        return ResponseEntity.ok(userService.getUserByFirebaseUid(uid));
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User user) {
        return ResponseEntity.ok(userService.updateUser(id, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}

