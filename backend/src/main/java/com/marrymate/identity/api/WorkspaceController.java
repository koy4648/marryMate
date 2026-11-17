package com.marrymate.identity.api;

import java.util.List;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.marrymate.identity.application.WorkspaceService;
import com.marrymate.identity.security.CurrentUser;

@RestController @RequestMapping("/api/v1/workspaces")
public class WorkspaceController {
    private final WorkspaceService service; public WorkspaceController(WorkspaceService service){this.service=service;}
    @GetMapping List<WorkspaceService.WorkspaceView> list(@AuthenticationPrincipal CurrentUser user){return service.list(user.id());}
    @PostMapping("/{workspaceId}/invites") WorkspaceService.InviteView invite(@PathVariable Long workspaceId,@AuthenticationPrincipal CurrentUser user){return service.invite(workspaceId,user.id());}
    @PostMapping("/join") WorkspaceService.WorkspaceView join(@RequestBody JoinRequest request,@AuthenticationPrincipal CurrentUser user){return service.join(user.id(),request.inviteCode());}
    @PatchMapping("/{workspaceId}") WorkspaceService.WorkspaceView rename(@PathVariable Long workspaceId,@AuthenticationPrincipal CurrentUser user,@Valid @RequestBody RenameRequest request){return service.rename(workspaceId,user.id(),request.name());}
    record JoinRequest(String inviteCode){}
    record RenameRequest(@NotBlank @Size(max=120) String name){}
}

