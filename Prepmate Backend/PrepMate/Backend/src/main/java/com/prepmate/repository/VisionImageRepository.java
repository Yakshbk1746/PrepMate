package com.prepmate.repository;

import com.prepmate.model.VisionImage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VisionImageRepository extends JpaRepository<VisionImage, Long> {
    List<VisionImage> findByUserId(Long userId);
}
