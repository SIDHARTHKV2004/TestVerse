package com.testverse.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String email;
    private String username;
    private String name;
    private String password;
}