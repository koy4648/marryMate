package com.marrymate.identity.application;

import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.marrymate.identity.domain.*;
import com.marrymate.identity.repository.*;
import com.marrymate.identity.security.TokenCodec;

@Service
public class WorkspaceService {
    private final WorkspaceRepository workspaces; private final WorkspaceMemberRepository members; private final WorkspaceInviteRepository invites; private final TokenCodec tokens; private final UserRepository users; private final com.marrymate.budget.repository.BudgetPlanRepository budgets;
    public WorkspaceService(WorkspaceRepository workspaces, WorkspaceMemberRepository members, WorkspaceInviteRepository invites, TokenCodec tokens, UserRepository users, com.marrymate.budget.repository.BudgetPlanRepository budgets) { this.workspaces=workspaces; this.members=members; this.invites=invites; this.tokens=tokens; this.users=users; this.budgets=budgets; }
    public void requireMember(Long workspaceId, Long userId) { if (!members.existsByWorkspaceIdAndUserId(workspaceId,userId)) throw new ResponseStatusException(HttpStatus.FORBIDDEN,"이 커플 공간에 접근할 수 없습니다."); }
    @Transactional(readOnly=true) public List<WorkspaceView> list(Long userId) { return members.findAllByUserId(userId).stream().map(member -> { CoupleWorkspace w=workspaces.findById(member.getWorkspaceId()).orElseThrow(); return new WorkspaceView(w.getId(),w.getName(),member.getRole(),w.getWeddingDate(),w.getHomeTitle(),w.getHomeMessage()); }).toList(); }
    @Transactional public WorkspaceView create(Long userId,String name,LocalDate weddingDate) {
        if(name==null || name.isBlank() || name.trim().length()>120) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"스페이스 이름을 120자 이내로 입력해 주세요.");
        CoupleWorkspace workspace=workspaces.save(new CoupleWorkspace(name.trim(),weddingDate));
        members.save(new WorkspaceMember(workspace.getId(),userId,"OWNER"));
        budgets.save(new com.marrymate.budget.domain.BudgetPlan(workspace.getId()));
        return new WorkspaceView(workspace.getId(),workspace.getName(),"OWNER",workspace.getWeddingDate(),workspace.getHomeTitle(),workspace.getHomeMessage());
    }
    @Transactional public InviteView invite(Long workspaceId, Long userId) { requireMember(workspaceId,userId); String code=tokens.create().substring(0,8).toUpperCase(); WorkspaceInvite invite=invites.save(new WorkspaceInvite(workspaceId,userId,tokens.hash(code))); return new InviteView(code,invite.getExpiresAt().toString()); }
    @Transactional public WorkspaceView join(Long userId,String code) { if(code==null || !code.trim().matches("[A-Za-z0-9_-]{8}")) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"8자리 초대코드를 입력해 주세요."); WorkspaceInvite invite=invites.findByCodeHash(tokens.hash(code.trim().toUpperCase())).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,"유효한 초대 코드를 찾지 못했습니다.")); if(!invite.isUsable()) throw new ResponseStatusException(HttpStatus.GONE,"만료되었거나 이미 사용한 초대 코드입니다."); Long workspaceId=invite.getWorkspaceId(); if(!members.existsByWorkspaceIdAndUserId(workspaceId,userId)) members.save(new WorkspaceMember(workspaceId,userId,"MEMBER")); invite.use(); CoupleWorkspace w=workspaces.findById(workspaceId).orElseThrow(); return new WorkspaceView(w.getId(),w.getName(),"MEMBER",w.getWeddingDate(),w.getHomeTitle(),w.getHomeMessage()); }
    @Transactional public WorkspaceView rename(Long workspaceId,Long userId,String name,LocalDate weddingDate,String homeTitle,String homeMessage) { WorkspaceMember member=members.findByWorkspaceIdAndUserId(workspaceId,userId).orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,"이 커플 공간에 접근할 수 없습니다.")); if(!"OWNER".equals(member.getRole())) throw new ResponseStatusException(HttpStatus.FORBIDDEN,"그룹을 만든 사람만 이름을 바꿀 수 있습니다."); CoupleWorkspace workspace=workspaces.findById(workspaceId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,"그룹을 찾지 못했습니다.")); workspace.update(name,weddingDate); workspace.customizeHome(homeTitle,homeMessage); return new WorkspaceView(workspace.getId(),workspace.getName(),member.getRole(),workspace.getWeddingDate(),workspace.getHomeTitle(),workspace.getHomeMessage()); }
    @Transactional public List<WorkspaceView> leave(Long workspaceId,Long userId) {
        workspaces.lockById(workspaceId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,"모임을 찾지 못했어요."));
        var member=members.findByWorkspaceIdAndUserId(workspaceId,userId).orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,"참여 중인 모임만 떠날 수 있어요."));
        if("OWNER".equals(member.getRole())) members.findAllByWorkspaceIdOrderByIdAsc(workspaceId).stream().filter(m->!m.getUserId().equals(userId)).findFirst().ifPresent(WorkspaceMember::makeOwner);
        invites.deleteByWorkspaceIdAndCreatedBy(workspaceId,userId);
        members.delete(member); members.flush();
        if(members.findAllByUserId(userId).isEmpty()) {
            var user=users.findById(userId).orElseThrow();
            var personal=workspaces.save(new CoupleWorkspace(user.getNickname()+"의 결혼 준비",null));
            members.save(new WorkspaceMember(personal.getId(),userId,"OWNER"));
            budgets.save(new com.marrymate.budget.domain.BudgetPlan(personal.getId()));
        }
        return list(userId);
    }
    public record WorkspaceView(Long id,String name,String role,LocalDate weddingDate,String homeTitle,String homeMessage) {} public record InviteView(String inviteCode,String expiresAt) {}
}

