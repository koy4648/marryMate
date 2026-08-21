package com.marrymate.backend.auth.api;

import com.marrymate.backend.auth.application.AuthService;
import com.marrymate.backend.auth.security.CurrentUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService authService;
    public AuthController(AuthService authService) { this.authService = authService; }

    @PostMapping("/signup")
    public AuthService.LoginResult signup(@Valid @RequestBody SignupRequest request) {
        return authService.signup(request.email(), request.password(), request.nickname());
    }

    @PostMapping("/login")
    public AuthService.LoginResult login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request.email(), request.password());
    }

    @GetMapping("/me")
    public AuthService.MeResult me(@AuthenticationPrincipal CurrentUser user) { return authService.me(user); }

    public record SignupRequest(@NotBlank @Email String email,
                                @NotBlank @Size(min = 8, max = 100) String password,
                                @NotBlank @Size(max = 50) String nickname) {}
    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}
}
