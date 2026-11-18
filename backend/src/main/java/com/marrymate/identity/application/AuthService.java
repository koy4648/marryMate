package com.marrymate.identity.application;

import java.time.LocalDate;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.marrymate.budget.domain.BudgetPlan;
import com.marrymate.budget.repository.BudgetPlanRepository;
import com.marrymate.identity.domain.*;
import com.marrymate.identity.repository.*;
import com.marrymate.identity.security.TokenCodec;

@Service
public class AuthService {
    private final UserRepository users; private final WorkspaceRepository workspaces; private final WorkspaceMemberRepository members;
    private final AuthSessionRepository sessions; private final BudgetPlanRepository budgets; private final PasswordEncoder passwords; private final TokenCodec tokens;
    public AuthService(UserRepository users, WorkspaceRepository workspaces, WorkspaceMemberRepository members, AuthSessionRepository sessions, BudgetPlanRepository budgets, PasswordEncoder passwords, TokenCodec tokens) {
        this.users=users; this.workspaces=workspaces; this.members=members; this.sessions=sessions; this.budgets=budgets; this.passwords=passwords; this.tokens=tokens;
    }
    @Transactional public SessionView signup(String email, String password, String nickname, LocalDate weddingDate) {
        String normalized = email.trim().toLowerCase();
        if (users.existsByEmail(normalized)) throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 사용 중인 이메일입니다.");
        User user = users.save(new User(normalized, passwords.encode(password), nickname));
        CoupleWorkspace workspace = workspaces.save(new CoupleWorkspace(nickname.trim() + "의 결혼 준비",weddingDate));
        members.save(new WorkspaceMember(workspace.getId(), user.getId(), "OWNER")); budgets.save(new BudgetPlan(workspace.getId()));
        return issue(user, workspace.getId());
    }
    @Transactional public SessionView login(String email, String password) {
        User user = users.findByEmail(email.trim().toLowerCase()).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호를 확인해 주세요."));
        if (!passwords.matches(password, user.getPasswordHash())) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호를 확인해 주세요.");
        Long workspaceId = members.findAllByUserId(user.getId()).stream().findFirst().map(WorkspaceMember::getWorkspaceId).orElse(null);
        return issue(user, workspaceId);
    }
    @Transactional public void logout(String rawToken) { sessions.deleteByTokenHash(tokens.hash(rawToken)); }
    @Transactional public UserView rename(Long userId, String nickname) { User user=users.findById(userId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,"사용자를 찾지 못했습니다.")); user.rename(nickname); return new UserView(user.getId(),user.getEmail(),user.getNickname()); }
    @Transactional public SessionView changePassword(Long userId, String currentPassword, String newPassword) {
        User user=users.findById(userId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,"사용자를 찾지 못했어요."));
        if(!passwords.matches(currentPassword,user.getPasswordHash())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"현재 비밀번호가 일치하지 않아요.");
        if(newPassword==null || newPassword.length()<8 || newPassword.length()>100) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"새 비밀번호는 8~100자로 입력해 주세요.");
        user.changePassword(passwords.encode(newPassword));
        sessions.deleteByUserId(userId);
        Long workspaceId=members.findAllByUserId(userId).stream().findFirst().map(WorkspaceMember::getWorkspaceId).orElse(null);
        return issue(user,workspaceId);
    }
    private SessionView issue(User user, Long workspaceId) { String raw = tokens.create(); sessions.save(new AuthSession(user.getId(), tokens.hash(raw))); return new SessionView(raw, new UserView(user.getId(), user.getEmail(), user.getNickname()), workspaceId); }
    public record UserView(Long id, String email, String nickname) {}
    public record SessionView(String token, UserView user, Long workspaceId) {}
}

