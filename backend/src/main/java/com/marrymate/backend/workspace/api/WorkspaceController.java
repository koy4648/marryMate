package com.marrymate.backend.workspace.api;

import com.marrymate.backend.auth.security.CurrentUser;
import com.marrymate.backend.workspace.application.WorkspaceService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/workspaces")
public class WorkspaceController {
    private final WorkspaceService service;
    public WorkspaceController(WorkspaceService service) { this.service = service; }

    @GetMapping
    public List<WorkspaceService.WorkspaceResult> list(@AuthenticationPrincipal CurrentUser user) {
        return service.list(user.id());
    }
    @PostMapping("/{workspaceId}/invites")
    public WorkspaceService.InviteResult invite(@AuthenticationPrincipal CurrentUser user,
                                                @PathVariable Long workspaceId) {
        return service.invite(user.id(), workspaceId);
    }
    @PostMapping("/join")
    public WorkspaceService.WorkspaceResult join(@AuthenticationPrincipal CurrentUser user,
                                                 @Valid @RequestBody JoinRequest request) {
        return service.join(user.id(), request.inviteCode());
    }
    public record JoinRequest(@NotBlank String inviteCode) {}
}
