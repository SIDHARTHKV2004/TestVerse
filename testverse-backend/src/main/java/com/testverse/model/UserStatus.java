package com.testverse.model;

public enum UserStatus {
    PENDING,    // Waiting for admin approval
    ACTIVE,     // Approved and can login
    SUSPENDED,  // Temporarily blocked
    REJECTED    // Registration rejected
}