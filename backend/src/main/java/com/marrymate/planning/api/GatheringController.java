package com.marrymate.planning.api;

import com.marrymate.identity.security.CurrentUser;
import com.marrymate.planning.application.GatheringService;
import com.marrymate.planning.application.PlanningService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/gatherings")
public class GatheringController {
    private final GatheringService service;
    public GatheringController(GatheringService service) { this.service=service; }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    PlanningService.ItemView create(@RequestHeader("X-Workspace-Id") Long workspaceId,@AuthenticationPrincipal CurrentUser user,@Valid @RequestBody GatheringService.Input input) { return service.save(workspaceId,user.id(),null,input); }
    @PutMapping("/{id}")
    PlanningService.ItemView update(@RequestHeader("X-Workspace-Id") Long workspaceId,@AuthenticationPrincipal CurrentUser user,@PathVariable Long id,@Valid @RequestBody GatheringService.Input input) { return service.save(workspaceId,user.id(),id,input); }
}
