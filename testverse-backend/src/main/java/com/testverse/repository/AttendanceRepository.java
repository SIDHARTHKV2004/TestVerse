package com.testverse.repository;

import com.testverse.model.AttendanceEntity;
import com.testverse.model.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<AttendanceEntity, Long> {

    Optional<AttendanceEntity> findByUserAndAttendanceDate(UserEntity user, LocalDate attendanceDate);

    Optional<AttendanceEntity> findByUserIdAndAttendanceDate(Long userId, LocalDate attendanceDate);

    List<AttendanceEntity> findByAttendanceDate(LocalDate attendanceDate);

    List<AttendanceEntity> findByAttendanceDateAndUserIn(LocalDate attendanceDate, Collection<UserEntity> users);

    List<AttendanceEntity> findByUser(UserEntity user);
}
