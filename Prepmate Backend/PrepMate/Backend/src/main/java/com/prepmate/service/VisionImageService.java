package com.prepmate.service;

import com.prepmate.model.VisionImage;
import com.prepmate.repository.VisionImageRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class VisionImageService {

    private final VisionImageRepository visionImageRepository;
    public VisionImageService(VisionImageRepository visionImageRepository) {
        this.visionImageRepository = visionImageRepository;
    }


    public List<VisionImage> getAllImages(Long userId) {
        return visionImageRepository.findByUserId(userId);
    }

    public VisionImage createImage(VisionImage image) {
        return visionImageRepository.save(image);
    }

    public void deleteImage(Long id) {
        visionImageRepository.deleteById(id);
    }
}

