package com.marrymate.identity.api;
import java.util.List;
import com.marrymate.identity.application.NavigationService;
import com.marrymate.identity.security.CurrentUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1/preferences/navigation")
public class NavigationController {
    private final NavigationService service;
    public NavigationController(NavigationService service) { this.service=service; }
    @GetMapping List<String> get(@AuthenticationPrincipal CurrentUser user) { return service.get(user.id()); }
    @PutMapping List<String> save(@AuthenticationPrincipal CurrentUser user,@Valid @RequestBody Input input) { return service.save(user.id(),input.menus()); }
    public record Input(@NotNull @Size(min=1,max=7) List<@NotNull String> menus) {}
}
