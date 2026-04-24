package com.prepmate.repository;

import com.prepmate.model.Resource;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ResourceRepository extends JpaRepository<Resource, Long> {
    List<Resource> findByUserId(Long userId);
    List<Resource> findByUserIdAndCategory(Long userId, String category);
    List<Resource> findByUserIdAndFavorite(Long userId, Boolean favorite);
}
