package com.gerenciarun.repository;

import com.gerenciarun.model.Event;
import com.gerenciarun.model.User;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findAllByUser(User user);
}
