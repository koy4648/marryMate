package com.marrymate.backend.workspace.application;

import com.marrymate.backend.auth.security.TokenCodec;
import com.marrymate.backend.common.exception.ApiException;
import com.marrymate.backend.user.domain.User;
import com.marrymate.backend.user.repository.UserRepository;
import com.marrymate.backend.workspace.domain.*;
import com.marrymate.backend.workspace.repository.CoupleWorkspaceRepository;
import com.marrymate.backend.workspace.repository.WorkspaceInviteRepository;
import com.marrymate.backend.workspace.repository.WorkspaceMemberRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class WorkspaceService {
    private final WorkspaceMemberRepository members;
    private final WorkspaceInviteRepository invites;
    private final CoupleWorkspaceRepository workspaces;
    private final UserRepository users;

    public WorkspaceService(WorkspaceMemberRepository members, WorkspaceInviteRepository invites,
                            CoupleWorkspaceRepository workspaces, UserRepository users) {
        this.members = members; this.invites = invites; this.workspaces = workspaces; this.users = users;
    }

    public List<WorkspaceResult> list(Long userId) {
        return members.findAllWithWorkspaceByUserId(userId).stream()
                .map(m -> new WorkspaceResult(m.getWorkspace().getId(), m.getWorkspace().getName(), m.getRole().name()))
                .toList();
    }

    @Transactional
    public InviteResult invite(Long userId, Long workspaceId) {
        requireMember(workspaceId, userId);
        User user = users.getReferenceById(userId);
        CoupleWorkspace workspace = workspaces.findById(workspaceId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "워크스페이스를 찾을 수 없습니다."));
        String code = TokenCodec.randomToken(12);
        LocalDateTime expiresAt = LocalDateTime.now().plusDays(7);
        invites.save(WorkspaceInvite.create(workspace, TokenCodec.hash(code), user, expiresAt));
        return new InviteResult(code, expiresAt);
    }

    @Transactional
    public WorkspaceResult join(Long userId, String code) {
        WorkspaceInvite invite = invites.findByInviteCodeHash(TokenCodec.hash(code.trim()))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "유효한 초대 코드를 찾을 수 없습니다."));
        LocalDateTime now = LocalDateTime.now();
        if (!invite.isUsable(now)) throw new ApiException(HttpStatus.GONE, "초대 코드가 만료되었거나 이미 사용되었습니다.");
        CoupleWorkspace workspace = invite.getWorkspace();
        User user = users.getReferenceById(userId);
        if (!members.existsByWorkspaceIdAndUserId(workspace.getId(), userId))
            members.save(WorkspaceMember.create(workspace, user, WorkspaceRole.MEMBER));
        invite.use(user, now);
        return new WorkspaceResult(workspace.getId(), workspace.getName(), WorkspaceRole.MEMBER.name());
    }

    public void requireMember(Long workspaceId, Long userId) {
        if (!members.existsByWorkspaceIdAndUserId(workspaceId, userId))
            throw new ApiException(HttpStatus.FORBIDDEN, "이 워크스페이스에 접근할 수 없습니다.");
    }

    public record WorkspaceResult(Long id, String name, String role) {}
    public record InviteResult(String inviteCode, LocalDateTime expiresAt) {}
}
