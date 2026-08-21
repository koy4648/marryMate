package com.marrymate.backend.venue.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.marrymate.backend.auth.security.CurrentUser;
import com.marrymate.backend.venue.application.VenuePlanService;
import com.marrymate.backend.venue.domain.CandidateStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/venue-plans")
public class VenuePlanController {
    private final VenuePlanService service;
    public VenuePlanController(VenuePlanService service) { this.service = service; }

    @PostMapping
    public VenuePlanService.PlanResult create(@AuthenticationPrincipal CurrentUser user,
            @RequestHeader("X-Workspace-Id") Long workspaceId, @Valid @RequestBody CreatePlanRequest request) {
        return service.createPlan(user.id(), workspaceId, request.venueName(), request.address(), request.candidateStatus());
    }
    @GetMapping
    public List<VenuePlanService.PlanResult> list(@AuthenticationPrincipal CurrentUser user,
            @RequestHeader("X-Workspace-Id") Long workspaceId) {
        return service.listPlans(user.id(), workspaceId);
    }
    @GetMapping("/{planId}")
    public VenuePlanService.PlanResult get(@AuthenticationPrincipal CurrentUser user,
            @RequestHeader("X-Workspace-Id") Long workspaceId, @PathVariable Long planId) {
        return service.getPlan(user.id(), workspaceId, planId);
    }
    @PatchMapping("/{planId}")
    public VenuePlanService.PlanResult patch(@AuthenticationPrincipal CurrentUser user,
            @RequestHeader("X-Workspace-Id") Long workspaceId, @PathVariable Long planId,
            @Valid @RequestBody ChangeStatusRequest request) {
        return service.changeStatus(user.id(), workspaceId, planId, request.candidateStatus());
    }
    @PostMapping("/{planId}/visits")
    public JsonNode createVisit(@AuthenticationPrincipal CurrentUser user,
            @RequestHeader("X-Workspace-Id") Long workspaceId, @PathVariable Long planId,
            @RequestBody JsonNode payload) {
        return service.createVisit(user.id(), workspaceId, planId, payload);
    }
    @GetMapping("/{planId}/visits")
    public List<JsonNode> listVisits(@AuthenticationPrincipal CurrentUser user,
            @RequestHeader("X-Workspace-Id") Long workspaceId, @PathVariable Long planId) {
        return service.listVisits(user.id(), workspaceId, planId);
    }
    @PutMapping("/{planId}/visits/{visitId}")
    public JsonNode updateVisit(@AuthenticationPrincipal CurrentUser user,
            @RequestHeader("X-Workspace-Id") Long workspaceId, @PathVariable Long planId,
            @PathVariable Long visitId, @RequestBody JsonNode payload) {
        return service.updateVisit(user.id(), workspaceId, planId, visitId, payload);
    }

    public record CreatePlanRequest(@NotBlank @Size(max = 150) String venueName,
                                    @Size(max = 500) String address,
                                    @NotNull CandidateStatus candidateStatus) {}
    public record ChangeStatusRequest(@NotNull CandidateStatus candidateStatus) {}
}
