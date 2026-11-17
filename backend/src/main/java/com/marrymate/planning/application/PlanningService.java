package com.marrymate.planning.application;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.marrymate.identity.application.WorkspaceService;
import com.marrymate.planning.domain.PlanningItem;
import com.marrymate.planning.repository.PlanningItemRepository;

@Service
public class PlanningService {
    private static final List<Template> TEMPLATES = List.of(
        new Template("웨딩홀", "웨딩홀 투어"),
        new Template("플래너", "웨딩 플래너"),
        new Template("본식 촬영", "본식 스냅·원판"), new Template("본식 촬영", "DVD"), new Template("본식 촬영", "아이폰 스냅"),
        new Template("스튜디오", "촬영 작가"), new Template("스튜디오", "헬퍼"), new Template("스튜디오", "헤어변형"),
        new Template("스튜디오", "헤어"), new Template("스튜디오", "메이크업"), new Template("스튜디오", "스튜디오 대여"),
        new Template("스튜디오", "드레스"), new Template("스튜디오", "예복"),
        new Template("본식", "헬퍼"), new Template("본식", "헤어·메이크업"), new Template("본식", "드레스"),
        new Template("본식", "예복"), new Template("본식", "혼주 한복"), new Template("본식", "아버지 예복"),
        new Template("본식", "혼주 헤어·메이크업"), new Template("스드메", "스드메 패키지"),
        new Template("신혼여행", "항공권"), new Template("신혼여행", "숙소"), new Template("신혼여행", "투어·티켓"),
        new Template("신혼여행", "여권·비자"), new Template("신혼여행", "여행자보험"), new Template("신혼여행", "공항 이동"),
        new Template("신혼여행", "유심·eSIM"), new Template("신혼여행", "환전·결제수단"), new Template("신혼여행", "짐 싸기")
    );

    private final PlanningItemRepository items;
    private final WorkspaceService workspaces;
    public PlanningService(PlanningItemRepository items, WorkspaceService workspaces) { this.items = items; this.workspaces = workspaces; }

    @Transactional
    public List<ItemView> list(Long workspaceId, Long userId) {
        workspaces.requireMember(workspaceId, userId);
        if (!items.existsByWorkspaceId(workspaceId)) {
            items.saveAll(TEMPLATES.stream().map(template -> new PlanningItem(workspaceId, template.group(), template.name())).toList());
        }
        return views(workspaceId);
    }

    @Transactional
    public ItemView create(Long workspaceId, Long userId, ChangeItem command) {
        workspaces.requireMember(workspaceId, userId);
        PlanningItem item = new PlanningItem(workspaceId, command.serviceGroup(), command.itemName());
        apply(item, command);
        return ItemView.from(items.save(item));
    }

    @Transactional
    public ItemView update(Long workspaceId, Long userId, Long itemId, ChangeItem command) {
        workspaces.requireMember(workspaceId, userId);
        PlanningItem item = find(workspaceId, itemId);
        apply(item, command);
        return ItemView.from(item);
    }

    @Transactional
    public void delete(Long workspaceId, Long userId, Long itemId) {
        workspaces.requireMember(workspaceId, userId);
        items.delete(find(workspaceId, itemId));
    }

    @Transactional
    public List<ItemView> selectCandidate(Long workspaceId, Long userId, Long itemId) {
        workspaces.requireMember(workspaceId, userId);
        PlanningItem selected = find(workspaceId, itemId);
        items.findAllByWorkspaceIdOrderByServiceGroupAscItemNameAscIdAsc(workspaceId).stream()
            .filter(item -> item.getServiceGroup().equals(selected.getServiceGroup()) && item.getItemName().equals(selected.getItemName()))
            .forEach(item -> { if (item.getId().equals(selected.getId())) item.contract(); else item.skip(); });
        return views(workspaceId);
    }

    private void apply(PlanningItem item, ChangeItem command) {
        BigDecimal quote = command.quotedAmount() == null ? BigDecimal.ZERO : command.quotedAmount();
        BigDecimal actual = command.actualAmount() == null ? BigDecimal.ZERO : command.actualAmount();
        BigDecimal packageBase = command.packageBaseAmount() == null ? BigDecimal.ZERO : command.packageBaseAmount();
        BigDecimal packageAdditional = command.packageAdditionalAmount() == null ? BigDecimal.ZERO : command.packageAdditionalAmount();
        if (quote.signum() < 0 || actual.signum() < 0 || packageBase.signum() < 0 || packageAdditional.signum() < 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "금액은 0원 이상이어야 합니다.");
        item.change(command.serviceGroup(), command.itemName(), command.vendorName(), command.status(), command.scheduleDate(),
            quote, actual, command.packageContract(), packageBase, packageAdditional, command.packageIncludedItems(),
            command.packageAdditionalDetails(), command.rating(), command.reviewType(), command.review(), command.pros(), command.cons(), command.memo());
    }

    private PlanningItem find(Long workspaceId, Long itemId) {
        return items.findByIdAndWorkspaceId(itemId, workspaceId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "준비 항목을 찾지 못했습니다."));
    }
    private List<ItemView> views(Long workspaceId) { return items.findAllByWorkspaceIdOrderByServiceGroupAscItemNameAscIdAsc(workspaceId).stream().map(ItemView::from).toList(); }

    private record Template(String group, String name) {}
    public record ChangeItem(String serviceGroup, String itemName, String vendorName, String status, LocalDate scheduleDate,
                             BigDecimal quotedAmount, BigDecimal actualAmount, boolean packageContract,
                             BigDecimal packageBaseAmount, BigDecimal packageAdditionalAmount, String packageIncludedItems,
                             String packageAdditionalDetails, Integer rating, String reviewType,
                             String review, String pros, String cons, String memo) {}
    public record ItemView(Long id, String serviceGroup, String itemName, String vendorName, String status,
                           LocalDate scheduleDate, BigDecimal quotedAmount, BigDecimal actualAmount, Integer rating,
                           boolean packageContract, BigDecimal packageBaseAmount, BigDecimal packageAdditionalAmount,
                           String packageIncludedItems, String packageAdditionalDetails, String reviewType,
                           String review, String pros, String cons, String memo) {
        static ItemView from(PlanningItem item) { return new ItemView(item.getId(), item.getServiceGroup(), item.getItemName(),
            item.getVendorName(), item.getStatus(), item.getScheduleDate(), item.getQuotedAmount(), item.getActualAmount(),
            item.getRating(), item.isPackageContract(), item.getPackageBaseAmount(), item.getPackageAdditionalAmount(),
            item.getPackageIncludedItems(), item.getPackageAdditionalDetails(), item.getReviewType(), item.getReview(),
            item.getPros(), item.getCons(), item.getMemo()); }
    }
}
