package com.gerenciarun.config;

import com.gerenciarun.model.Event;
import com.gerenciarun.model.Role;
import com.gerenciarun.model.User;
import com.gerenciarun.repository.EventRepository;
import com.gerenciarun.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner loadData(UserRepository userRepository, EventRepository eventRepository,
                               PasswordEncoder passwordEncoder) {
        return args -> {
            if (!userRepository.findAll().isEmpty()) {
                return;
            }

            User admin = new User("admin", passwordEncoder.encode("admin123"), Role.ROLE_ADMIN);
            User alfredo = new User("alfredo", passwordEncoder.encode("runner123"), Role.ROLE_USER);
            User geovane = new User("geovane", passwordEncoder.encode("runner123"), Role.ROLE_USER);
            User camila = new User("camila", passwordEncoder.encode("runner123"), Role.ROLE_USER);

            userRepository.saveAll(List.of(admin, alfredo, geovane, camila));

            Event event1 = new Event();
            event1.setTitle("Treino Intervalado");
            event1.setDescription("Série de 6x800m com pausa de 2min.");
            event1.setStartDate(LocalDateTime.now().plusDays(1).withHour(7).withMinute(0));
            event1.setEndDate(LocalDateTime.now().plusDays(1).withHour(8).withMinute(0));
            event1.setUser(alfredo);

            Event event2 = new Event();
            event2.setTitle("Longão Leve");
            event2.setDescription("12km em ritmo confortável.");
            event2.setStartDate(LocalDateTime.now().plusDays(2).withHour(6).withMinute(30));
            event2.setEndDate(LocalDateTime.now().plusDays(2).withHour(8).withMinute(0));
            event2.setUser(camila);

            eventRepository.saveAll(List.of(event1, event2));
        };
    }
}
