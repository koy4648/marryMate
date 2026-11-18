package com.marrymate.identity;

import com.marrymate.identity.application.AuthService;
import com.marrymate.identity.application.WorkspaceService;
import com.marrymate.identity.repository.AuthSessionRepository;
import com.marrymate.identity.repository.WorkspaceMemberRepository;
import com.marrymate.identity.security.TokenCodec;
import com.marrymate.budget.application.BudgetService;
import java.math.BigDecimal;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.server.ResponseStatusException;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties={"spring.jpa.hibernate.ddl-auto=create-drop", "spring.datasource.url=jdbc:h2:mem:account-settings;MODE=MySQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE"})
@ActiveProfiles("test")
class AccountSettingsTests {
    @Autowired AuthService auth;
    @Autowired WorkspaceService workspaces;
    @Autowired WorkspaceMemberRepository members;
    @Autowired AuthSessionRepository sessions;
    @Autowired TokenCodec tokens;
    @Autowired BudgetService budgets;

    AuthService.SessionView signup() {
        return auth.signup(UUID.randomUUID()+"@test.local","old-password","테스트",null);
    }
    @Test void passwordChangeRequiresCurrentPasswordAndRevokesOldSessions() {
        var user=signup();
        var another=auth.login(user.user().email(),"old-password");
        assertThrows(ResponseStatusException.class,()->auth.changePassword(user.user().id(),"wrong-password","new-password"));
        assertTrue(sessions.findByTokenHash(tokens.hash(user.token())).isPresent());
        assertThrows(ResponseStatusException.class,()->auth.changePassword(user.user().id(),"old-password","short"));
        var changed=auth.changePassword(user.user().id(),"old-password","new-password");
        assertTrue(sessions.findByTokenHash(tokens.hash(user.token())).isEmpty());
        assertTrue(sessions.findByTokenHash(tokens.hash(another.token())).isEmpty());
        assertTrue(sessions.findByTokenHash(tokens.hash(changed.token())).isPresent());
        assertThrows(ResponseStatusException.class,()->auth.login(user.user().email(),"old-password"));
        assertEquals(user.user().id(),auth.login(user.user().email(),"new-password").user().id());
    }
    @Test void leavingSharedWorkspaceRemovesAccessAndRevokesInvitesWithoutErasingRecords() {
        var owner=signup(); var guest=signup(); var outsider=signup();
        workspaces.join(guest.user().id(),workspaces.invite(owner.workspaceId(),owner.user().id()).inviteCode());
        budgets.changeTarget(owner.workspaceId(),owner.user().id(),new BigDecimal("123456"));
        var invite=workspaces.invite(owner.workspaceId(),guest.user().id()).inviteCode();
        var remaining=workspaces.leave(owner.workspaceId(),guest.user().id());
        assertEquals(1,remaining.size()); assertEquals(guest.workspaceId(),remaining.getFirst().id());
        assertThrows(ResponseStatusException.class,()->workspaces.requireMember(owner.workspaceId(),guest.user().id()));
        assertThrows(ResponseStatusException.class,()->workspaces.join(outsider.user().id(),invite));
        assertEquals(0,new BigDecimal("123456").compareTo(budgets.get(owner.workspaceId(),owner.user().id()).targetAmount()));
    }
    @Test void departingOwnerTransfersOwnershipAndGetsANewPersonalSpace() {
        var owner=signup(); var first=signup(); var second=signup();
        workspaces.join(first.user().id(),workspaces.invite(owner.workspaceId(),owner.user().id()).inviteCode());
        workspaces.join(second.user().id(),workspaces.invite(owner.workspaceId(),owner.user().id()).inviteCode());
        var remaining=workspaces.leave(owner.workspaceId(),owner.user().id());
        assertEquals(1,remaining.size()); assertNotEquals(owner.workspaceId(),remaining.getFirst().id());
        assertEquals("OWNER",remaining.getFirst().role());
        assertEquals("OWNER",members.findByWorkspaceIdAndUserId(owner.workspaceId(),first.user().id()).orElseThrow().getRole());
        assertEquals("MEMBER",members.findByWorkspaceIdAndUserId(owner.workspaceId(),second.user().id()).orElseThrow().getRole());
        assertEquals(BigDecimal.ZERO.compareTo(budgets.get(remaining.getFirst().id(),owner.user().id()).targetAmount()),0);
        assertEquals(remaining.getFirst().id(),auth.login(owner.user().email(),"old-password").workspaceId());
    }
    @Test void soleOwnerCanLeaveAndNonMembersCannotRemoveMemberships() {
        var owner=signup(); var other=signup();
        assertThrows(ResponseStatusException.class,()->workspaces.leave(owner.workspaceId(),other.user().id()));
        var remaining=workspaces.leave(owner.workspaceId(),owner.user().id());
        assertEquals(1,remaining.size()); assertNotEquals(owner.workspaceId(),remaining.getFirst().id());
        assertThrows(ResponseStatusException.class,()->workspaces.requireMember(owner.workspaceId(),owner.user().id()));
    }
}
