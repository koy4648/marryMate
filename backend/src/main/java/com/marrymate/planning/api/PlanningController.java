package com.marrymate.planning.api;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.marrymate.identity.security.CurrentUser;
import com.marrymate.planning.application.PlanningService;

@RestController
@RequestMapping("/api/v1/planning-items")
public class PlanningController {
    private final PlanningService service;
    public PlanningController(PlanningService service) { this.service = service; }

    @GetMapping List<PlanningService.ItemView> list(@RequestHeader("X-Workspace-Id") Long workspaceId, @AuthenticationPrincipal CurrentUser user) { return service.list(workspaceId, user.id()); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) PlanningService.ItemView create(@RequestHeader("X-Workspace-Id") Long workspaceId, @AuthenticationPrincipal CurrentUser user, @Valid @RequestBody ItemRequest request) { return service.create(workspaceId, user.id(), request.command()); }
    @PutMapping("/{itemId}") PlanningService.ItemView update(@RequestHeader("X-Workspace-Id") Long workspaceId, @AuthenticationPrincipal CurrentUser user, @PathVariable Long itemId, @Valid @RequestBody ItemRequest request) { return service.update(workspaceId, user.id(), itemId, request.command()); }
    @DeleteMapping("/{itemId}") @ResponseStatus(HttpStatus.NO_CONTENT) void delete(@RequestHeader("X-Workspace-Id") Long workspaceId, @AuthenticationPrincipal CurrentUser user, @PathVariable Long itemId) { service.delete(workspaceId, user.id(), itemId); }

    record ItemRequest(@NotBlank @Size(max=80) String serviceGroup, @NotBlank @Size(max=120) String itemName,
        @Size(max=160) String vendorName, @Pattern(regexp="TODO|RESEARCHING|SCHEDULED|CONTRACTED|DONE|SKIPPED") String status,
        LocalDate scheduleDate, @PositiveOrZero BigDecimal quotedAmount, @PositiveOrZero BigDecimal actualAmount,
        @Min(1) @Max(5) Integer rating, @Pattern(regexp="NONE|SECRET_TOUR|CONSULTATION|GUEST_TOUR|GENERAL") String reviewType,
        @Size(max=10000) String review, @Size(max=1000) String pros, @Size(max=1000) String cons, @Size(max=1000) String memo) {
        PlanningService.ChangeItem command() { return new PlanningService.ChangeItem(serviceGroup, itemName, vendorName, status,
            scheduleDate, quotedAmount, actualAmount, rating, reviewType, review, pros, cons, memo); }
    }
}
