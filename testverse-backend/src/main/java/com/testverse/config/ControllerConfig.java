package com.testverse.config;

import com.testverse.controller.InvitationController;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ControllerConfig {

    @Bean
    public InvitationController invitationController() {
        return new InvitationController();
    }
}