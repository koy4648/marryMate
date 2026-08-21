package com.marrymate.backend.auth.security;

import com.marrymate.backend.auth.repository.AuthSessionRepository;
import com.marrymate.backend.user.domain.UserStatus;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

@Component
public class SessionAuthenticationFilter extends OncePerRequestFilter {
    private final AuthSessionRepository sessions;

    public SessionAuthenticationFilter(AuthSessionRepository sessions) {
        this.sessions = sessions;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String rawToken = header.substring(7).trim();
            sessions.findValid(TokenCodec.hash(rawToken), LocalDateTime.now())
                    .filter(session -> session.getUser().getStatus() == UserStatus.ACTIVE)
                    .ifPresent(session -> {
                        var user = session.getUser();
                        var principal = new CurrentUser(user.getId(), user.getEmail(), user.getNickname());
                        SecurityContextHolder.getContext().setAuthentication(
                                new UsernamePasswordAuthenticationToken(principal, rawToken, List.of()));
                    });
        }
        filterChain.doFilter(request, response);
    }
}
