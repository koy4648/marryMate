package com.marrymate.identity.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.*;
import com.marrymate.identity.application.AuthService;

@RestController @RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService auth;
    public AuthController(AuthService auth) { this.auth = auth; }
    @PostMapping("/signup") AuthService.SessionView signup(@Valid @RequestBody SignupRequest request) { return auth.signup(request.email(), request.password(), request.nickname()); }
    @PostMapping("/login") AuthService.SessionView login(@Valid @RequestBody LoginRequest request) { return auth.login(request.email(), request.password()); }
    @PostMapping("/logout") void logout(@RequestHeader(HttpHeaders.AUTHORIZATION) String authorization) { auth.logout(authorization.substring(7)); }
    record SignupRequest(@Email String email, @Size(min=8,max=100) String password, @NotBlank @Size(max=80) String nickname) {}
    record LoginRequest(@Email String email, @NotBlank String password) {}
}

