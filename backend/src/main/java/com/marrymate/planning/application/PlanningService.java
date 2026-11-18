package com.marrymate.planning.application;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
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
        syncExtraPayments(workspaceId);
        return ItemView.from(item);
    }

    @Transactional
    public ItemView update(Long workspaceId, Long userId, Long itemId, ChangeItem command) {
        workspaces.requireMember(workspaceId, userId);
        PlanningItem item = find(workspaceId, itemId);
        apply(item, command);
        linkPackageTemplates(workspaceId);
        syncExtraPayments(workspaceId);
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
        if(selected.isPackageContract()) selected.contract();
        else items.findAllByWorkspaceIdOrderByServiceGroupAscItemNameAscIdAsc(workspaceId).stream()
            .filter(item -> item.getPackageParentId()==null && item.getServiceGroup().equals(selected.getServiceGroup()) && item.getItemName().equals(selected.getItemName()))
            .forEach(item -> { if (item.getId().equals(selected.getId())) item.contract(); else item.skip(); });
        linkPackageTemplates(workspaceId);
        syncExtraPayments(workspaceId);
        return views(workspaceId);
    }

    private void apply(PlanningItem item, ChangeItem command) {
        if(command.scheduleTime()!=null && command.scheduleDate()==null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"방문 시간을 입력하려면 날짜도 선택해 주세요.");
        if (command.packageParentId() != null) {
            PlanningItem parent = find(item.getWorkspaceId(), command.packageParentId());
            if (!parent.isPackageContract() || "SKIPPED".equals(parent.getStatus()) || parent.getPackageParentId()!=null || parent.getId().equals(item.getId()) || command.packageContract()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"포함 항목은 다른 패키지 계약에만 연결할 수 있어요.");
        }
        if(command.packageParentId()!=null && item.getId()!=null && !java.util.Objects.equals(item.getPackageParentId(),command.packageParentId())) {
            var individual=payments.findAllByWorkspaceIdOrderByDueDateAsc(item.getWorkspaceId()).stream()
                .filter(p->item.getId().equals(p.getPlanningItemId()) && !"EXTRA".equals(p.getType()) && !"CANCELLED".equals(p.getStatus())).toList();
            if(individual.stream().anyMatch(p->p.getActualAmount().signum()>0 || "PAID".equals(p.getStatus()) || !java.util.List.of("DEPOSIT","INTERIM","BALANCE").contains(p.getType())))
                throw new ResponseStatusException(HttpStatus.CONFLICT,"이미 납부했거나 별도 정산이 필요한 개별 결제가 있어요. 기존 납부 기록을 확인한 뒤 패키지에 연결해 주세요.");
            individual.forEach(com.marrymate.budget.domain.Payment::cancelScheduled);
        }
        if(!command.packageContract() && items.findAllByWorkspaceIdOrderByServiceGroupAscItemNameAscIdAsc(item.getWorkspaceId()).stream().anyMatch(child->item.getId()!=null && item.getId().equals(child.getPackageParentId()))) throw new ResponseStatusException(HttpStatus.CONFLICT,"연결된 포함 항목을 개별 계약으로 변경한 뒤 패키지를 해제해 주세요.");
        item.linkPackage(command.packageParentId());
        BigDecimal quote = command.quotedAmount() == null ? BigDecimal.ZERO : command.quotedAmount();
        BigDecimal actual = command.actualAmount() == null ? BigDecimal.ZERO : command.actualAmount();
        BigDecimal packageBase = command.packageBaseAmount() == null ? BigDecimal.ZERO : command.packageBaseAmount();
        BigDecimal extra=command.extraAmount()==null?(command.packageContract() && command.packageAdditionalAmount()!=null?command.packageAdditionalAmount():BigDecimal.ZERO):command.extraAmount();
        String extraDetails=command.extraDetails()==null?(command.packageContract()?command.packageAdditionalDetails():""):command.extraDetails();
        BigDecimal packageAdditional=command.packageContract()?extra:BigDecimal.ZERO;
        if(extra.signum()<0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"추가금은 0원 이상이어야 해요.");
        if (quote.signum() < 0 || actual.signum() < 0 || packageBase.signum() < 0 || packageAdditional.signum() < 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "금액은 0원 이상이어야 합니다.");
        if(command.packageContract()) PackageInclusions.parts(command.packageIncludedItems());
        item.change(command.packageContract() ? "패키지" : command.serviceGroup(), command.itemName(), command.vendorName(), command.status(), command.scheduleDate(),
            command.packageParentId()!=null ? BigDecimal.ZERO : quote, command.packageParentId()!=null ? BigDecimal.ZERO : actual, command.packageContract(), packageBase, packageAdditional, command.packageIncludedItems(),
            command.packageContract()?extraDetails:command.packageAdditionalDetails(), command.rating(), command.reviewType(), command.review(), command.pros(), command.cons(), command.memo());
        item.changeScheduleTime(command.scheduleTime());
        item.changeExtras(extra,extraDetails,command.extraDueDate());
        if(command.packageParentId()!=null) {
            PlanningItem parent=find(item.getWorkspaceId(),command.packageParentId());
            String label=PackageInclusions.labelFor(item.getServiceGroup(),item.getItemName());
            if(label!=null && PackageInclusions.parts(parent.getPackageIncludedItems()).stream().noneMatch(part->part.group().equals(item.getServiceGroup())&&part.name().equals(item.getItemName()))) parent.includeItem(label);
        }
    }

    private boolean untouched(PlanningItem item) {
        return item.getVendorName().isBlank() && "TODO".equals(item.getStatus()) && item.getQuotedAmount().signum()==0
            && item.getActualAmount().signum()==0 && item.getScheduleDate()==null && item.getScheduleTime()==null && item.getRating()==null
            && item.getExtraAmount().signum()==0 && item.getExtraDetails().isBlank() && item.getExtraDueDate()==null
            && item.getReview().isBlank() && item.getMemo().isBlank() && item.getPros().isBlank() && item.getCons().isBlank()
            && !payments.existsByPlanningItemId(item.getId());
    }

    // Every inclusion belongs to one package. Reuse blank templates, preserve recorded candidates.
    private void linkPackageTemplates(Long workspaceId) {
        var all=new java.util.ArrayList<>(items.findAllByWorkspaceIdOrderByServiceGroupAscItemNameAscIdAsc(workspaceId));
        var parents=all.stream().filter(p->p.isPackageContract() && !"SKIPPED".equals(p.getStatus())).toList();
        for(var child:java.util.List.copyOf(all)) {
            if(child.getPackageInclusion()==null) continue;
            var parent=parents.stream().filter(p->p.getId().equals(child.getPackageParentId())).findFirst();
            boolean stillIncluded=parent.isPresent() && PackageInclusions.parts(parent.get().getPackageIncludedItems()).stream()
                .anyMatch(part->part.group().equals(child.getServiceGroup()) && part.name().equals(child.getItemName()));
            if(!stillIncluded) {
                if(untouched(child) && PackageInclusions.parts(child.getPackageInclusion()).stream().anyMatch(part->part.group().equals(child.getServiceGroup()) && part.name().equals(child.getItemName()))) { items.delete(child); all.remove(child); }
                else child.linkPackage(null);
            }
        }
        for(var parent:parents) {
            for(var part:PackageInclusions.parts(parent.getPackageIncludedItems())) {
                var linked=all.stream().filter(c->parent.getId().equals(c.getPackageParentId()) && part.group().equals(c.getServiceGroup()) && part.name().equals(c.getItemName()))
                    .sorted(java.util.Comparator.comparing(this::untouched)).toList();
                if(!linked.isEmpty()) {
                    linked.getFirst().linkInclusion(parent.getId(),part.label());
                    for(var duplicate:linked.subList(1,linked.size())) {
                        if(duplicate.getPackageInclusion()!=null && untouched(duplicate)) { items.delete(duplicate); all.remove(duplicate); }
                    }
                    continue;
                }
                var blank=all.stream().filter(c->!c.isPackageContract() && c.getPackageParentId()==null && part.group().equals(c.getServiceGroup()) && part.name().equals(c.getItemName()) && untouched(c)).findFirst();
                PlanningItem child=blank.orElseGet(()->{
                    var created=items.save(new PlanningItem(workspaceId,part.group(),part.name())); all.add(created); return created;
                });
                child.linkInclusion(parent.getId(),part.label());
            }
        }
    }

    private void syncExtraPayments(Long workspaceId) {
        var all=items.findAllByWorkspaceIdOrderByServiceGroupAscItemNameAscIdAsc(workspaceId);
        var ledger=payments.findAllByWorkspaceIdOrderByDueDateAsc(workspaceId);
        for(var item:all) {
            var existing=ledger.stream().filter(p->item.getId().equals(p.getPlanningItemId()) && "EXTRA".equals(p.getType())).findFirst();
            var parent=all.stream().filter(p->p.getId().equals(item.getPackageParentId())).findFirst();
            boolean confirmed=parent.map(p->java.util.List.of("CONTRACTED","DONE").contains(p.getStatus())).orElse(java.util.List.of("CONTRACTED","DONE").contains(item.getStatus()));
            boolean active=!"SKIPPED".equals(item.getStatus()) && confirmed;
            BigDecimal amount=item.getExtraAmount();
            if(existing.isPresent() && existing.get().getActualAmount().signum()>0 && (amount.compareTo(existing.get().getActualAmount())<0 || item.getExtraDueDate()==null))
                throw new ResponseStatusException(HttpStatus.CONFLICT,"이미 납입한 추가금은 납입액보다 줄이거나 결제 예정일을 지울 수 없어요.");
            if(amount.signum()==0 || item.getExtraDueDate()==null || !active) {
                existing.filter(p->p.getActualAmount().signum()==0).ifPresent(payments::delete); continue;
            }
            String category=parent.isPresent()?"패키지":item.getServiceGroup();
            String title=parent.map(p->(p.getVendorName().isBlank()?p.getItemName():p.getVendorName())+" · ").orElse("")+(item.getVendorName().isBlank()?item.getItemName():item.getVendorName()+" · "+item.getItemName())+" 추가금";
            title=title.substring(0,Math.min(title.length(),160));
            var payment=existing.orElse(null);
            if(payment==null) payment=new com.marrymate.budget.domain.Payment(workspaceId,category,title,"EXTRA",amount,item.getExtraDueDate(),"공동",item.getExtraDetails());
            payment.linkPlanningItem(item.getId()); payment.updateExtra(category,title,amount,item.getExtraDueDate(),item.getExtraDetails()); payments.save(payment);
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
                             String review, String pros, String cons, String memo, Long packageParentId, LocalTime scheduleTime, BigDecimal extraAmount, String extraDetails, LocalDate extraDueDate) {}
    public record ItemView(Long id, String serviceGroup, String itemName, String vendorName, String status,
                           LocalDate scheduleDate, BigDecimal quotedAmount, BigDecimal actualAmount, Integer rating,
                           boolean packageContract, BigDecimal packageBaseAmount, BigDecimal packageAdditionalAmount,
                           String packageIncludedItems, String packageAdditionalDetails, String reviewType,
                           String review, String pros, String cons, String memo, Long packageParentId, LocalTime scheduleTime, BigDecimal extraAmount, String extraDetails, LocalDate extraDueDate, BigDecimal contractAmountOverride) {
        static ItemView from(PlanningItem item) { return new ItemView(item.getId(), item.getServiceGroup(), item.getItemName(),
            item.getVendorName(), item.getStatus(), item.getScheduleDate(), item.getQuotedAmount(), item.getActualAmount(),
            item.getRating(), item.isPackageContract(), item.getPackageBaseAmount(), item.getPackageAdditionalAmount(),
            item.getPackageIncludedItems(), item.getPackageAdditionalDetails(), item.getReviewType(), item.getReview(),
            item.getPros(), item.getCons(), item.getMemo(), item.getPackageParentId(), item.getScheduleTime(), item.getExtraAmount(), item.getExtraDetails(), item.getExtraDueDate(), item.getContractAmountOverride()); }
    }
}
