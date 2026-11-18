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
        new Template("본식", "혼주 헤어·메이크업"),
        new Template("신혼여행", "항공권"), new Template("신혼여행", "숙소"), new Template("신혼여행", "투어·티켓"),
        new Template("신혼여행", "여권·비자"), new Template("신혼여행", "여행자보험"), new Template("신혼여행", "공항 이동"),
        new Template("신혼여행", "유심·eSIM"), new Template("신혼여행", "환전·결제수단"), new Template("신혼여행", "짐 싸기")
    );

    private final PlanningItemRepository items;
    private final WorkspaceService workspaces;
    private final com.marrymate.budget.repository.PaymentRepository payments;
    public PlanningService(PlanningItemRepository items, WorkspaceService workspaces, com.marrymate.budget.repository.PaymentRepository payments) { this.items = items; this.workspaces = workspaces; this.payments=payments; }

    @Transactional
    public List<ItemView> list(Long workspaceId, Long userId) {
        workspaces.requireMember(workspaceId, userId);
        if (!items.existsByWorkspaceId(workspaceId)) {
            items.saveAll(TEMPLATES.stream().map(template -> new PlanningItem(workspaceId, template.group(), template.name())).toList());
        }
        linkPackageTemplates(workspaceId);
        return views(workspaceId);
    }

    @Transactional
    public ItemView create(Long workspaceId, Long userId, ChangeItem command) {
        workspaces.requireMember(workspaceId, userId);
        PlanningItem item = new PlanningItem(workspaceId, command.serviceGroup(), command.itemName());
        apply(item, command);
        items.save(item);
        linkPackageTemplates(workspaceId);
        return ItemView.from(item);
    }

    @Transactional
    public ItemView update(Long workspaceId, Long userId, Long itemId, ChangeItem command) {
        workspaces.requireMember(workspaceId, userId);
        PlanningItem item = find(workspaceId, itemId);
        apply(item, command);
        linkPackageTemplates(workspaceId);
        return ItemView.from(item);
    }

    @Transactional
    public void delete(Long workspaceId, Long userId, Long itemId) {
        workspaces.requireMember(workspaceId, userId);
        PlanningItem item = find(workspaceId, itemId);
        if (payments.existsByPlanningItemId(itemId)) throw new ResponseStatusException(HttpStatus.CONFLICT,"연결된 결제 내역이 있어 삭제할 수 없어요. 진행 상태를 건너뜀으로 바꿔주세요.");
        items.findAllByWorkspaceIdOrderByServiceGroupAscItemNameAscIdAsc(workspaceId).stream().filter(child -> itemId.equals(child.getPackageParentId())).forEach(child -> child.linkPackage(null));
        items.delete(item);
    }

    @Transactional
    public List<ItemView> selectCandidate(Long workspaceId, Long userId, Long itemId) {
        workspaces.requireMember(workspaceId, userId);
        PlanningItem selected = find(workspaceId, itemId);
        items.findAllByWorkspaceIdOrderByServiceGroupAscItemNameAscIdAsc(workspaceId).stream()
            .filter(item -> item.getServiceGroup().equals(selected.getServiceGroup()) && item.getItemName().equals(selected.getItemName()))
            .forEach(item -> { if (item.getId().equals(selected.getId())) item.contract(); else item.skip(); });
        linkPackageTemplates(workspaceId);
        return views(workspaceId);
    }

    private void apply(PlanningItem item, ChangeItem command) {
        if (command.packageParentId() != null) {
            PlanningItem parent = find(item.getWorkspaceId(), command.packageParentId());
            if (!parent.isPackageContract() || parent.getPackageParentId()!=null || parent.getId().equals(item.getId()) || command.packageContract()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"포함 항목은 다른 패키지 계약에만 연결할 수 있어요.");
        }
        if(command.packageParentId()!=null && item.getId()!=null && payments.existsByPlanningItemId(item.getId())) throw new ResponseStatusException(HttpStatus.CONFLICT,"개별 결제가 연결된 항목은 패키지에 포함할 수 없어요.");
        if(!command.packageContract() && items.findAllByWorkspaceIdOrderByServiceGroupAscItemNameAscIdAsc(item.getWorkspaceId()).stream().anyMatch(child->item.getId()!=null && item.getId().equals(child.getPackageParentId()))) throw new ResponseStatusException(HttpStatus.CONFLICT,"연결된 포함 항목을 개별 계약으로 변경한 뒤 패키지를 해제해 주세요.");
        item.linkPackage(command.packageParentId());
        BigDecimal quote = command.quotedAmount() == null ? BigDecimal.ZERO : command.quotedAmount();
        BigDecimal actual = command.actualAmount() == null ? BigDecimal.ZERO : command.actualAmount();
        BigDecimal packageBase = command.packageBaseAmount() == null ? BigDecimal.ZERO : command.packageBaseAmount();
        BigDecimal packageAdditional = command.packageAdditionalAmount() == null ? BigDecimal.ZERO : command.packageAdditionalAmount();
        if (quote.signum() < 0 || actual.signum() < 0 || packageBase.signum() < 0 || packageAdditional.signum() < 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "금액은 0원 이상이어야 합니다.");
        item.change(command.packageContract() ? "패키지" : command.serviceGroup(), command.itemName(), command.vendorName(), command.status(), command.scheduleDate(),
            quote, actual, command.packageContract(), packageBase, packageAdditional, command.packageIncludedItems(),
            command.packageAdditionalDetails(), command.rating(), command.reviewType(), command.review(), command.pros(), command.cons(), command.memo());
    }

    // Only untouched checklist templates are connected automatically. Candidate quotes stay independent.
    private void linkPackageTemplates(Long workspaceId) {
        var all=items.findAllByWorkspaceIdOrderByServiceGroupAscItemNameAscIdAsc(workspaceId);
        var labels=java.util.Map.ofEntries(
            java.util.Map.entry("스튜디오|촬영 작가","스튜디오 촬영"), java.util.Map.entry("스튜디오|스튜디오 대여","스튜디오 촬영"),
            java.util.Map.entry("스튜디오|드레스","스튜디오 드레스"), java.util.Map.entry("스튜디오|헤어","스튜디오 헤어·메이크업"), java.util.Map.entry("스튜디오|메이크업","스튜디오 헤어·메이크업"),
            java.util.Map.entry("스튜디오|헬퍼","촬영 헬퍼"), java.util.Map.entry("스튜디오|헤어변형","헤어변형"), java.util.Map.entry("스튜디오|예복","촬영 예복"),
            java.util.Map.entry("본식|드레스","본식 드레스"), java.util.Map.entry("본식|헤어·메이크업","본식 헤어·메이크업"), java.util.Map.entry("본식|헬퍼","본식 헬퍼"),
            java.util.Map.entry("본식|예복","본식 예복"), java.util.Map.entry("본식|혼주 한복","혼주 한복"), java.util.Map.entry("본식|혼주 헤어·메이크업","혼주 헤어·메이크업"),
            java.util.Map.entry("본식 촬영|본식 스냅·원판","본식 스냅·원판"), java.util.Map.entry("본식 촬영|DVD","DVD"), java.util.Map.entry("본식 촬영|아이폰 스냅","아이폰 스냅"), java.util.Map.entry("플래너|웨딩 플래너","플래너"));
        for(var child:all) {
            if(child.getPackageParentId()!=null || child.isPackageContract() || !child.getVendorName().isBlank() || !"TODO".equals(child.getStatus()) || child.getQuotedAmount().signum()!=0) continue;
            String label=labels.get(child.getServiceGroup()+"|"+child.getItemName());
            if(label==null) continue;
            var parents=all.stream().filter(parent->parent.isPackageContract() && java.util.List.of("CONTRACTED","DONE").contains(parent.getStatus()) && java.util.Arrays.asList(parent.getPackageIncludedItems().split("\\|")).contains(label)).toList();
            if(parents.size()==1) child.linkPackage(parents.getFirst().getId());
        }
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
                             String review, String pros, String cons, String memo, Long packageParentId) {}
    public record ItemView(Long id, String serviceGroup, String itemName, String vendorName, String status,
                           LocalDate scheduleDate, BigDecimal quotedAmount, BigDecimal actualAmount, Integer rating,
                           boolean packageContract, BigDecimal packageBaseAmount, BigDecimal packageAdditionalAmount,
                           String packageIncludedItems, String packageAdditionalDetails, String reviewType,
                           String review, String pros, String cons, String memo, Long packageParentId) {
        static ItemView from(PlanningItem item) { return new ItemView(item.getId(), item.getServiceGroup(), item.getItemName(),
            item.getVendorName(), item.getStatus(), item.getScheduleDate(), item.getQuotedAmount(), item.getActualAmount(),
            item.getRating(), item.isPackageContract(), item.getPackageBaseAmount(), item.getPackageAdditionalAmount(),
            item.getPackageIncludedItems(), item.getPackageAdditionalDetails(), item.getReviewType(), item.getReview(),
            item.getPros(), item.getCons(), item.getMemo(), item.getPackageParentId()); }
    }
}
