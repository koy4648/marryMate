package com.marrymate.backend.auth.application;

import com.marrymate.backend.auth.domain.AuthSession;
import com.marrymate.backend.auth.repository.AuthSessionRepository;
import com.marrymate.backend.auth.security.CurrentUser;
import com.marrymate.backend.auth.security.TokenCodec;
import com.marrymate.backend.common.exception.ApiException;
import com.marrymate.backend.user.domain.User;
import com.marrymate.backend.user.repository.UserRepository;
import com.marrymate.backend.workspace.domain.CoupleWorkspace;
import com.marrymate.backend.workspace.domain.WorkspaceMember;
import com.marrymate.backend.workspace.domain.WorkspaceRole;
import com.marrymate.backend.workspace.repository.CoupleWorkspaceRepository;
import com.marrymate.backend.workspace.repository.WorkspaceMemberRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Locale;

@Service
@Transactional(readOnly = true)
public class AuthService {
    private final UserRepository users;
    private final AuthSessionRepository sessions;
    private final CoupleWorkspaceRepository workspaces;
    private final WorkspaceMemberRepository members;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository users, AuthSessionRepository sessions,
                       CoupleWorkspaceRepository workspaces, WorkspaceMemberRepository members,
                       PasswordEncoder passwordEncoder) {
        this.users = users;
        this.sessions = sessions;
        this.workspaces = workspaces;
        this.members = members;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public LoginResult signup(String email, String password, String nickname) {
        String normalized = normalize(email);
        if (users.existsByEmail(normalized)) throw new ApiException(HttpStatus.CONFLICT, "이미 가입된 이메일입니다.");
        validatePassword(password);
        User user = users.save(User.create(normalized, passwordEncoder.encode(password), nickname));
        CoupleWorkspace workspace = workspaces.save(CoupleWorkspace.create(nickname.trim() + "의 결혼 준비", user));
        members.save(WorkspaceMember.create(workspace, user, WorkspaceRole.OWNER));
        return issue(user, workspace.getId());
    }

    @Transactional
    public LoginResult login(String email, String password) {
        User user = users.findByEmail(normalize(email))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다."));
        if (!passwordEncoder.matches(password, user.getPasswordHash()))
            throw new ApiException(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다.");
        Long workspaceId = members.findAllWithWorkspaceByUserId(user.getId()).stream()
                .findFirst().map(member -> member.getWorkspace().getId()).orElse(null);
        return issue(user, workspaceId);
    }

    public MeResult me(CurrentUser user) {
        return new MeResult(user.id(), user.email(), user.nickname());
    }

    private LoginResult issue(User user, Long workspaceId) {
        String token = TokenCodec.randomToken(32);
        sessions.save(AuthSession.create(user, TokenCodec.hash(token), LocalDateTime.now().plusDays(30)));
        return new LoginResult(token, new MeResult(user.getId(), user.getEmail(), user.getNickname()), workspaceId);
    }

    private String normalize(String email) {
        if (email == null) return "";
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private void validatePassword(String password) {
        if (password == null || password.length() < 8)
            throw new ApiException(HttpStatus.BAD_REQUEST, "비밀번호는 8자 이상이어야 합니다.");
    }

    public record MeResult(Long id, String email, String nickname) {}
    public record LoginResult(String token, MeResult user, Long workspaceId) {}
}
