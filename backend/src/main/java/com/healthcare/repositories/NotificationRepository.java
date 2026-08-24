package com.healthcare.repositories;

import com.healthcare.models.Notification;
import com.healthcare.models.Notification.NotificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    List<Notification> findByStatusInOrderByCreatedAtAsc(List<NotificationStatus> statuses);

    List<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<Notification> findByAppointmentId(UUID appointmentId);
}
