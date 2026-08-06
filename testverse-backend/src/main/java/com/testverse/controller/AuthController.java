package com.testverse.controller;

import com.testverse.dto.AuthRequest;
import com.testverse.dto.AuthResponse;
import com.testverse.model.UserEntity;
import com.testverse.repository.UserRepository;
import com.testverse.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest authRequest) {
        System.out.println("🔐 LOGIN ATTEMPT");
        System.out.println("Email: " + authRequest.getEmail());

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            authRequest.getEmail(),
                            authRequest.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();

            UserEntity user = userRepository.findByEmail(authRequest.getEmail())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String token = jwtUtils.generateToken(
                    user.getUsername(),
                    user.getRole().name(),
                    user.getId()
            );

            System.out.println("✅ Login successful for: " + user.getUsername());

            AuthResponse response = AuthResponse.builder()
                    .token(token)
                    .userId(user.getId())
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .name(user.getName())
                    .role(user.getRole())
                    .build();

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("❌ Login failed: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(401).body("Invalid credentials: " + e.getMessage());
        }
    }
}