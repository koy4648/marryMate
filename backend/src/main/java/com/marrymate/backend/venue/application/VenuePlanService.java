package com.marrymate.backend.venue.application;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.marrymate.backend.common.exception.ApiException;
import com.marrymate.backend.user.domain.User;
import com.marrymate.backend.user.repository.UserRepository;
import com.marrymate.backend.venue.domain.*;
import com.marrymate.backend.venue.repository.VenuePlanRepository;
import com.marrymate.backend.venue.repository.VenueRepository;
import com.marrymate.backend.venue.repository.VenueVisitRepository;
import com.marrymate.backend.workspace.domain.CoupleWorkspace;
import com.marrymate.backend.workspace.repository.CoupleWorkspaceRepository;
import com.marrymate.backend.workspace.application.WorkspaceService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class VenuePlanService {
    private final VenueRepository venues;
    private final VenuePlanRepository plans;
    private final VenueVisitRepository visits;
    private final CoupleWorkspaceRepository workspaces;
    private final UserRepository users;
    private final WorkspaceService workspaceService;

    public VenuePlanService(VenueRepository venues, VenuePlanRepository plans, VenueVisitRepository visits,
                            CoupleWorkspaceRepository workspaces, UserRepository users,
                            WorkspaceService workspaceService) {
        this.venues = venues; this.plans = plans; this.visits = visits; this.workspaces = workspaces;
        this.users = users; this.workspaceService = workspaceService;
    }

    @Transactional
    public PlanResult createPlan(Long userId, Long workspaceId, String name, String address, CandidateStatus status) {
        workspaceService.requireMember(workspaceId, userId);
        CoupleWorkspace workspace = workspaces.findById(workspaceId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "워크스페이스를 찾을 수 없습니다."));
        Venue venue = venues.save(Venue.create(name, address));
        return toPlan(plans.save(VenuePlan.create(workspace, venue, status)));
    }

    public List<PlanResult> listPlans(Long userId, Long workspaceId) {
        workspaceService.requireMember(workspaceId, userId);
        return plans.findAllByWorkspace(workspaceId).stream().map(this::toPlan).toList();
    }

    public PlanResult getPlan(Long userId, Long workspaceId, Long planId) {
        workspaceService.requireMember(workspaceId, userId);
        return toPlan(findPlan(workspaceId, planId));
    }

    @Transactional
    public PlanResult changeStatus(Long userId, Long workspaceId, Long planId, CandidateStatus status) {
        workspaceService.requireMember(workspaceId, userId);
        VenuePlan plan = findPlan(workspaceId, planId); plan.changeStatus(status); return toPlan(plan);
    }

    @Transactional
    public JsonNode createVisit(Long userId, Long workspaceId, Long planId, JsonNode payload) {
        workspaceService.requireMember(workspaceId, userId);
        VenuePlan plan = findPlan(workspaceId, planId);
        User user = users.getReferenceById(userId);
        VenueVisit visit = visits.saveAndFlush(VenueVisit.create(plan, payload, user));
        return toVisit(visit);
    }

    public List<JsonNode> listVisits(Long userId, Long workspaceId, Long planId) {
        workspaceService.requireMember(workspaceId, userId); findPlan(workspaceId, planId);
        return visits.findAllByVenuePlanIdOrderByCreatedAtDesc(planId).stream().map(this::toVisit).toList();
    }

    @Transactional
    public JsonNode updateVisit(Long userId, Long workspaceId, Long planId, Long visitId, JsonNode payload) {
        workspaceService.requireMember(workspaceId, userId); findPlan(workspaceId, planId);
        VenueVisit visit = visits.findByIdAndVenuePlanId(visitId, planId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "방문 기록을 찾을 수 없습니다."));
        visit.update(payload, users.getReferenceById(userId));
        visits.flush();
        return toVisit(visit);
    }

    private VenuePlan findPlan(Long workspaceId, Long planId) {
        return plans.findAccessible(planId, workspaceId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "웨딩홀 계획을 찾을 수 없습니다."));
    }

    private PlanResult toPlan(VenuePlan plan) {
        Venue venue = plan.getVenue();
        return new PlanResult(plan.getId(), new VenueResult(venue.getId(), venue.getName(), venue.getAddress()),
                plan.getCandidateStatus(), plan.getCreatedAt());
    }

    private JsonNode toVisit(VenueVisit visit) {
        ObjectNode response = visit.getPayload().deepCopy();
        response.put("id", visit.getId().toString());
        response.put("venueId", visit.getVenuePlan().getId().toString());
        response.put("savedAt", visit.getUpdatedAt().toString());
        return response;
    }

    public record VenueResult(Long id, String name, String address) {}
    public record PlanResult(Long id, VenueResult venue, CandidateStatus candidateStatus, LocalDateTime createdAt) {}
}
