package com.marrymate.backend.auth.security;

public record CurrentUser(Long id, String email, String nickname) {
}
