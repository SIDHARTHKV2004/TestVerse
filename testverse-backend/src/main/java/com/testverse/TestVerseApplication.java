package com.testverse;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = {"com.testverse"})
public class TestVerseApplication {
    public static void main(String[] args) {
        SpringApplication.run(TestVerseApplication.class, args);
        System.out.println("======================================");
        System.out.println("TestVerse Backend Started Successfully!");
        System.out.println("Server running on: http://localhost:8080");
        System.out.println("======================================");
    }
}