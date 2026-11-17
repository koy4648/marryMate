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
    private final WorkspaceRepository workspaces; private final WorkspaceMemberRepository members; private final WorkspaceInviteRepository invites; private final TokenCodec tokens;
    public WorkspaceService(WorkspaceRepository workspaces, WorkspaceMemberRepository members, WorkspaceInviteRepository invites, TokenCodec tokens) { this.workspaces=workspaces; this.members=members; this.invites=invites; this.tokens=tokens; }
    public void requireMember(Long workspaceId, Long userId) { if (!members.existsByWorkspaceIdAndUserId(workspaceId,userId)) throw new ResponseStatusException(HttpStatus.FORBIDDEN,"이 커플 공간에 접근할 수 없습니다."); }
    @Transactional(readOnly=true) public List<WorkspaceView> list(Long userId) { return members.findAllByUserId(userId).stream().map(member -> { CoupleWorkspace w=workspaces.findById(member.getWorkspaceId()).orElseThrow(); return new WorkspaceView(w.getId(),w.getName(),member.getRole(),w.getWeddingDate()); }).toList(); }
    @Transactional public InviteView invite(Long workspaceId, Long userId) { requireMember(workspaceId,userId); String code=tokens.create().substring(0,8).toUpperCase(); WorkspaceInvite invite=invites.save(new WorkspaceInvite(workspaceId,userId,tokens.hash(code))); return new InviteView(code,invite.getExpiresAt().toString()); }
    @Transactional public WorkspaceView join(Long userId,String code) { WorkspaceInvite invite=invites.findByCodeHash(tokens.hash(code.trim().toUpperCase())).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,"유효한 초대 코드를 찾지 못했습니다.")); if(!invite.isUsable()) throw new ResponseStatusException(HttpStatus.GONE,"만료되었거나 이미 사용한 초대 코드입니다."); Long workspaceId=invite.getWorkspaceId(); if(!members.existsByWorkspaceIdAndUserId(workspaceId,userId)) members.save(new WorkspaceMember(workspaceId,userId,"MEMBER")); invite.use(); CoupleWorkspace w=workspaces.findById(workspaceId).orElseThrow(); return new WorkspaceView(w.getId(),w.getName(),"MEMBER",w.getWeddingDate()); }
    @Transactional public WorkspaceView rename(Long workspaceId,Long userId,String name,LocalDate weddingDate) { WorkspaceMember member=members.findByWorkspaceIdAndUserId(workspaceId,userId).orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,"이 커플 공간에 접근할 수 없습니다.")); if(!"OWNER".equals(member.getRole())) throw new ResponseStatusException(HttpStatus.FORBIDDEN,"그룹을 만든 사람만 이름을 바꿀 수 있습니다."); CoupleWorkspace workspace=workspaces.findById(workspaceId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,"그룹을 찾지 못했습니다.")); workspace.update(name,weddingDate); return new WorkspaceView(workspace.getId(),workspace.getName(),member.getRole(),workspace.getWeddingDate()); }
    public record WorkspaceView(Long id,String name,String role,LocalDate weddingDate) {} public record InviteView(String inviteCode,String expiresAt) {}
}

