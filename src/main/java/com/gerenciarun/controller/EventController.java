package com.gerenciarun.controller;

import com.gerenciarun.model.Event;
import com.gerenciarun.model.User;
import com.gerenciarun.repository.EventRepository;
import com.gerenciarun.repository.UserRepository;
import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class EventController {
    private final EventRepository eventRepository;
    private final UserRepository userRepository;

    public EventController(EventRepository eventRepository, UserRepository userRepository) {
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    public UserProfile me(Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        return new UserProfile(user.getId(), user.getUsername(), user.getRole().name());
    }

    @GetMapping("/me/events")
    public List<EventResponse> myEvents(Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        return eventRepository.findAllByUser(user).stream()
            .map(EventResponse::from)
            .collect(Collectors.toList());
    }

    @GetMapping("/admin/users/{userId}/events")
    @PreAuthorize("hasRole('ADMIN')")
    public List<EventResponse> eventsForUser(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        return eventRepository.findAllByUser(user).stream()
            .map(EventResponse::from)
            .collect(Collectors.toList());
    }

    @PostMapping("/admin/users/{userId}/events")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EventResponse> createEvent(@PathVariable Long userId,
                                                     @Valid @RequestBody EventRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        Event event = new Event();
        event.setTitle(request.title());
        event.setDescription(request.description());
        event.setStartDate(request.startDate());
        event.setEndDate(request.endDate());
        event.setUser(user);
        Event saved = eventRepository.save(event);
        return ResponseEntity.status(HttpStatus.CREATED).body(EventResponse.from(saved));
    }

    @PutMapping("/admin/users/{userId}/events/{eventId}")
    @PreAuthorize("hasRole('ADMIN')")
    public EventResponse updateEvent(@PathVariable Long userId, @PathVariable Long eventId,
                                     @Valid @RequestBody EventRequest request) {
        Event event = findEventForUser(userId, eventId);
        event.setTitle(request.title());
        event.setDescription(request.description());
        event.setStartDate(request.startDate());
        event.setEndDate(request.endDate());
        return EventResponse.from(eventRepository.save(event));
    }

    @DeleteMapping("/admin/users/{userId}/events/{eventId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteEvent(@PathVariable Long userId, @PathVariable Long eventId) {
        Event event = findEventForUser(userId, eventId);
        eventRepository.delete(event);
        return ResponseEntity.noContent().build();
    }

    private Event findEventForUser(Long userId, Long eventId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        Optional<Event> event = eventRepository.findById(eventId);
        if (event.isEmpty() || !event.get().getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        return event.get();
    }

    public record EventRequest(String title, LocalDateTime startDate, LocalDateTime endDate, String description) {
    }

    public record EventResponse(Long id, String title, LocalDateTime start, LocalDateTime end, String description) {
        public static EventResponse from(Event event) {
            return new EventResponse(
                event.getId(),
                event.getTitle(),
                event.getStartDate(),
                event.getEndDate(),
                event.getDescription()
            );
        }
    }

    public record UserProfile(Long id, String username, String role) {
    }
}
