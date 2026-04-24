package com.prepmate.controller;

import com.prepmate.model.Resource;
import com.prepmate.service.ResourceService;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.nio.file.Files;
import java.nio.file.Path;
import java.io.IOException;

@RestController
@RequestMapping("/resources")
public class ResourceController {

    private final ResourceService resourceService;
    public ResourceController(ResourceService resourceService) {
        this.resourceService = resourceService;
    }


    @GetMapping
    public ResponseEntity<List<Resource>> getAllResources(@RequestParam Long userId) {
        return ResponseEntity.ok(resourceService.getAllResources(userId));
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<Resource>> getByCategory(@RequestParam Long userId, @PathVariable String category) {
        return ResponseEntity.ok(resourceService.getResourcesByCategory(userId, category));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Resource> getResourceById(@PathVariable Long id) {
        return ResponseEntity.ok(resourceService.getResourceById(id));
    }

    @PostMapping
    public ResponseEntity<Resource> createResource(@RequestParam Long userId, @RequestBody Resource resource) {
        resource.setUserId(userId);
        return ResponseEntity.ok(resourceService.createResource(resource));
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Resource> uploadResource(
            @RequestParam Long userId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String name) {
        return ResponseEntity.ok(resourceService.uploadResource(userId, file, category, name));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<InputStreamResource> downloadResource(
            @PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean download) {
        Resource resource = resourceService.getResourceById(id);
        Path filePath;

        try {
            filePath = resourceService.resolveStoredFile(resource);
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        }

        try {
            String mime = resource.getMimeType();
            if (mime == null || mime.isBlank()) {
                mime = Files.probeContentType(filePath);
            }
            if (mime == null || mime.isBlank()) {
                mime = MediaType.APPLICATION_OCTET_STREAM_VALUE;
            }

            String safeName = resource.getOriginalFileName() != null && !resource.getOriginalFileName().isBlank()
                    ? resource.getOriginalFileName()
                    : resource.getName();

            String dispositionType = download ? "attachment" : "inline";

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(mime))
                    .header(HttpHeaders.CONTENT_DISPOSITION, dispositionType + "; filename=\"" + safeName + "\"")
                    .body(new InputStreamResource(Files.newInputStream(filePath)));
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to stream resource file", e);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Resource> updateResource(@PathVariable Long id, @RequestBody Resource resource) {
        return ResponseEntity.ok(resourceService.updateResource(id, resource));
    }

    @PatchMapping("/{id}/favorite")
    public ResponseEntity<Resource> toggleFavorite(@PathVariable Long id) {
        return ResponseEntity.ok(resourceService.toggleFavorite(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResource(@PathVariable Long id) {
        resourceService.deleteResource(id);
        return ResponseEntity.noContent().build();
    }
}

