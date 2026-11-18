package com.marrymate.identity.api;

import java.time.LocalDate;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.marrymate.identity.application.AuthService;
import com.marrymate.identity.security.CurrentUser;

@RestController @RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService auth;
    public AuthController(AuthService auth) { this.auth = auth; }
    @PostMapping("/signup") AuthService.SessionView signup(@Valid @RequestBody SignupRequest request) { return auth.signup(request.email(), request.password(), request.nickname(),request.weddingDate()); }
    @PostMapping("/login") AuthService.SessionView login(@Valid @RequestBody LoginRequest request) { return auth.login(request.email(), request.password()); }
    @PostMapping("/logout") void logout(@RequestHeader(HttpHeaders.AUTHORIZATION) String authorization) { auth.logout(authorization.substring(7)); }
    @PatchMapping("/me") AuthService.UserView rename(@AuthenticationPrincipal CurrentUser user,@Valid @RequestBody RenameRequest request) { return auth.rename(user.id(),request.nickname()); }
    @PatchMapping("/me/password") AuthService.SessionView changePassword(@AuthenticationPrincipal CurrentUser user,@Valid @RequestBody PasswordRequest request) { return auth.changePassword(user.id(),request.currentPassword(),request.newPassword()); }
    record PasswordRequest(@NotBlank String currentPassword,@NotBlank @Size(min=8,max=100) String newPassword) {}
    record SignupRequest(@Email String email, @Size(min=8,max=100) String password, @NotBlank @Size(max=80) String nickname, LocalDate weddingDate) {}
    record LoginRequest(@Email String email, @NotBlank String password) {}
    record RenameRequest(@NotBlank @Size(max=80) String nickname) {}
}

