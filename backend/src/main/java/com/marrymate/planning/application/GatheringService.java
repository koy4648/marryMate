package com.marrymate.planning.application;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import com.marrymate.identity.application.WorkspaceService;
import com.marrymate.planning.domain.GatheringAttendee;
import com.marrymate.planning.domain.PlanningItem;
import com.marrymate.planning.repository.PlanningItemRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class GatheringService {
    private final PlanningItemRepository items;
    private final WorkspaceService workspaces;
    public GatheringService(PlanningItemRepository items,WorkspaceService workspaces) { this.items=items; this.workspaces=workspaces; }

    @Transactional
    public PlanningService.ItemView save(Long workspaceId,Long userId,Long id,Input command) {
        workspaces.requireMember(workspaceId,userId);
        PlanningItem item=id==null?new PlanningItem(workspaceId,"청모",command.name().trim()):items.findByIdAndWorkspaceId(id,workspaceId)
            .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"청모를 찾지 못했어요."));
        if(!"청모".equals(item.getServiceGroup())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"청모 탭에서 만든 모임만 수정할 수 있어요.");
        if(command.attendees()==null || command.expectedAttendees()<command.attendees().size()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"참석 인원은 입력한 이름 수 이상이어야 해요.");
        if("SCHEDULED".equals(command.status()) && command.scheduleDate()==null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"일정 확정 상태에는 날짜를 입력해 주세요.");
        if(command.scheduleTime()!=null && command.scheduleDate()==null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"시간을 입력하려면 날짜도 선택해 주세요.");
        item.change("청모",command.name().trim(),command.place(),command.status(),command.scheduleDate(),command.amount(),item.getActualAmount(),false,BigDecimal.ZERO,BigDecimal.ZERO,"","",item.getRating(),"NONE","","","",command.memo());
        item.changeScheduleTime(command.scheduleTime());
        item.changeAttendees(command.expectedAttendees(),command.attendees().stream().map(person->new GatheringAttendee(person.name(),person.side())).toList());
        items.saveAndFlush(item);
        return PlanningService.ItemView.from(item);
    }
    public record Attendee(@NotBlank @Size(max=80) String name,@NotNull @Pattern(regexp="BRIDE|GROOM|BOTH") String side) {}
    public record Input(@NotBlank @Size(max=120) String name,@NotNull @Size(max=160) String place,
        LocalDate scheduleDate,LocalTime scheduleTime,@Min(0) @Max(2000) int expectedAttendees,
        @NotNull @Size(max=2000) List<@NotNull @Valid Attendee> attendees,
        @NotNull @Pattern(regexp="TODO|RESEARCHING|SCHEDULED|CONTRACTED|DONE|SKIPPED") String status,
        @NotNull @PositiveOrZero @Digits(integer=15,fraction=0) BigDecimal amount,@NotNull @Size(max=1000) String memo) {}
}
