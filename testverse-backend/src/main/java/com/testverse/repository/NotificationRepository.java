package com.testverse.repository;

import com.testverse.model.NotificationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<NotificationEntity, Long> {
    List<NotificationEntity> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<NotificationEntity> findByUserIdAndIsRead(Long userId, boolean isRead);
    List<NotificationEntity> findByUserIdAndType(Long userId, String type);
}