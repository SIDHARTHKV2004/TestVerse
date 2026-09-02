package com.testverse.controller;

import com.testverse.model.CommunityPostEntity;
import com.testverse.model.UserEntity;
import com.testverse.repository.CommunityPostRepository;
import com.testverse.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/posts")

public class CommunityController {

    @Autowired
    private CommunityPostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<CommunityPostEntity>> getAllPosts() {
        return ResponseEntity.ok(postRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<?> createPost(@RequestBody Map<String, Object> request, Authentication auth) {
        try {
            UserEntity user = userRepository.findByUsername(auth.getName()).orElse(null);
            if (user == null) return ResponseEntity.status(401).build();

            CommunityPostEntity post = new CommunityPostEntity();
            post.setTitle((String) request.get("title"));
            post.setContent((String) request.get("content"));
            post.setAuthor(user);
            post.setTags((String) request.get("tags"));
            post.setCodeSnippet((String) request.get("codeSnippet"));
            post.setCodeLanguage((String) request.get("codeLanguage"));
            post.setIsPinned(false);
            post.setLikesCount(0);
            post.setCommentsCount(0);
            post.setCreatedAt(LocalDateTime.now());
            post.setUpdatedAt(LocalDateTime.now());

            return ResponseEntity.ok(postRepository.save(post));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<?> likePost(@PathVariable Long id) {
        return postRepository.findById(id)
                .map(post -> {
                    post.setLikesCount(post.getLikesCount() + 1);
                    return ResponseEntity.ok(postRepository.save(post));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
