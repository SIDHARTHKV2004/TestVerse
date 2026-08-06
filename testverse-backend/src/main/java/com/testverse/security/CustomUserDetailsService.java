package com.testverse.security;

import com.testverse.model.UserEntity;
import com.testverse.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        System.out.println("🔍 CustomUserDetailsService - Loading user: " + username);

        UserEntity user = userRepository.findByEmail(username).orElse(null);

        if (user == null) {
            user = userRepository.findByUsername(username).orElse(null);
        }

        if (user == null) {
            System.out.println("❌ User NOT found: " + username);
            throw new UsernameNotFoundException("User not found: " + username);
        }

        System.out.println("✅ User found: " + user.getUsername());
        System.out.println("   Role: " + user.getRole());
        System.out.println("   Status: " + user.getStatus());
        System.out.println("   Enabled: " + user.isEnabled());

        return user;
    }
}