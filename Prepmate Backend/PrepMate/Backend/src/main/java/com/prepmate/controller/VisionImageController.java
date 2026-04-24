package com.prepmate.controller;

import com.prepmate.model.VisionImage;
import com.prepmate.service.VisionImageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/vision-images")
public class VisionImageController {

    private final VisionImageService visionImageService;
    public VisionImageController(VisionImageService visionImageService) {
        this.visionImageService = visionImageService;
    }


    @GetMapping
    public ResponseEntity<List<VisionImage>> getAllImages(@RequestParam Long userId) {
        return ResponseEntity.ok(visionImageService.getAllImages(userId));
    }

    @PostMapping
    public ResponseEntity<VisionImage> createImage(@RequestParam Long userId, @RequestBody VisionImage image) {
        image.setUserId(userId);
        return ResponseEntity.ok(visionImageService.createImage(image));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteImage(@PathVariable Long id) {
        visionImageService.deleteImage(id);
        return ResponseEntity.noContent().build();
    }
}

