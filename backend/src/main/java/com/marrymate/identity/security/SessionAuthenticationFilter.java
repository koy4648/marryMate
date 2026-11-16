package com.marrymate.identity.security;

import java.io.IOException;
import java.time.Instant;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import com.marrymate.identity.repository.AuthSessionRepository;
import jakarta.servlet.*;
import jakarta.servlet.http.*;

@Component
public class SessionAuthenticationFilter extends OncePerRequestFilter {
    private final AuthSessionRepository sessions; private final TokenCodec tokens;
    public SessionAuthenticationFilter(AuthSessionRepository sessions, TokenCodec tokens) { this.sessions = sessions; this.tokens = tokens; }
    @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith("Bearer ")) {
            sessions.findByTokenHash(tokens.hash(header.substring(7))).filter(session -> session.getExpiresAt().isAfter(Instant.now())).ifPresent(session -> {
                var principal = new CurrentUser(session.getUserId());
                SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(principal, null, java.util.List.of()));
            });
        }
        chain.doFilter(request, response);
    }
}

