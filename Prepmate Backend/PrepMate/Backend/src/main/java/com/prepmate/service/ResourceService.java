package com.prepmate.service;

import com.prepmate.model.Resource;
import com.prepmate.repository.ResourceRepository;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.Locale;
import java.util.List;
import java.util.UUID;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.io.IOException;

@Service
public class ResourceService {

    private final ResourceRepository resourceRepository;
    private final Path storageRoot = Paths.get("storage", "resources");

    public ResourceService(ResourceRepository resourceRepository) {
        this.resourceRepository = resourceRepository;
        try {
            Files.createDirectories(storageRoot);
        } catch (IOException e) {
            throw new RuntimeException("Failed to initialize resource storage directory", e);
        }
    }


    public List<Resource> getAllResources(Long userId) {
        return resourceRepository.findByUserId(userId);
    }

    public List<Resource> getResourcesByCategory(Long userId, String category) {
        return resourceRepository.findByUserIdAndCategory(userId, category);
    }

    public Resource getResourceById(Long id) {
        return resourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resource not found with id: " + id));
    }

    public Resource createResource(Resource resource) {
        if (resource.getDate() == null) resource.setDate(LocalDate.now());
        if (resource.getFavorite() == null) resource.setFavorite(false);
        return resourceRepository.save(resource);
    }

    public Resource uploadResource(Long userId, MultipartFile file, String category, String customName) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Uploaded file is empty");
        }

        try {
            Path userDir = storageRoot.resolve(String.valueOf(userId));
            Files.createDirectories(userDir);

            String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
            String extension = "";
            int dotIndex = originalName.lastIndexOf('.');
            if (dotIndex >= 0 && dotIndex < originalName.length() - 1) {
                extension = originalName.substring(dotIndex);
            }

            String safeStoredName = UUID.randomUUID() + extension;
            Path targetPath = userDir.resolve(safeStoredName).normalize();

            if (!targetPath.startsWith(userDir)) {
                throw new RuntimeException("Invalid file path");
            }

            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            Resource resource = new Resource();
            resource.setUserId(userId);
            resource.setName((customName != null && !customName.isBlank()) ? customName : originalName);
            resource.setCategory((category != null && !category.isBlank()) ? category : "Notes");
            resource.setType(detectType(originalName, file.getContentType()));
            resource.setSize(humanSize(file.getSize()));
            resource.setSizeBytes(file.getSize());
            resource.setMimeType(file.getContentType());
            resource.setOriginalFileName(originalName);
            resource.setStoredFileName(safeStoredName);
            resource.setFavorite(false);
            resource.setDate(LocalDate.now());

            return resourceRepository.save(resource);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store uploaded file", e);
        }
    }

    public Path resolveStoredFile(Resource resource) {
        if (resource.getStoredFileName() == null || resource.getStoredFileName().isBlank()) {
            throw new RuntimeException("No stored file associated with this resource");
        }

        Path userDir = storageRoot.resolve(String.valueOf(resource.getUserId()));
        Path filePath = userDir.resolve(resource.getStoredFileName()).normalize();

        if (!filePath.startsWith(userDir)) {
            throw new RuntimeException("Invalid stored file path");
        }

        if (!Files.exists(filePath)) {
            throw new RuntimeException("Stored file not found on server");
        }

        return filePath;
    }

    public Resource toggleFavorite(Long id) {
        Resource resource = getResourceById(id);
        resource.setFavorite(!resource.getFavorite());
        return resourceRepository.save(resource);
    }

    public Resource updateResource(Long id, Resource updated) {
        Resource resource = getResourceById(id);
        if (updated.getName() != null) resource.setName(updated.getName());
        if (updated.getCategory() != null) resource.setCategory(updated.getCategory());
        return resourceRepository.save(resource);
    }

    public void deleteResource(Long id) {
        Resource resource = getResourceById(id);

        if (resource.getStoredFileName() != null && !resource.getStoredFileName().isBlank()) {
            try {
                Path path = resolveStoredFile(resource);
                Files.deleteIfExists(path);
            } catch (Exception ignored) {
                // Keep deletion non-blocking if physical file is already missing.
            }
        }

        resourceRepository.deleteById(id);
    }

    private String detectType(String filename, String mimeType) {
        String lower = filename == null ? "" : filename.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".pdf")) return "pdf";
        if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".webp")) return "image";
        if (lower.endsWith(".mp4") || lower.endsWith(".mkv") || lower.endsWith(".webm") || lower.endsWith(".avi")) return "video";
        if (mimeType != null && mimeType.startsWith("image/")) return "image";
        if (mimeType != null && mimeType.startsWith("video/")) return "video";
        return "doc";
    }

    private String humanSize(long bytes) {
        if (bytes >= 1024L * 1024L) {
            return String.format(Locale.US, "%.1f MB", bytes / (1024.0 * 1024.0));
        }
        return Math.max(1, Math.round(bytes / 1024.0)) + " KB";
    }
}

