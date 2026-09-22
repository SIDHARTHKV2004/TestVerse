package com.testverse.repository;

import com.testverse.model.NotificationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository
        extends JpaRepository<NotificationEntity, String> {

    List<NotificationEntity> findByUserIdOrderByCreatedAtDesc(String userId);

    List<NotificationEntity> findByUserIdAndIsRead(
            String userId,
            boolean isRead
    );

    List<NotificationEntity> findByUserIdAndType(
            String userId,
            String type
    );
}