package com.marrymate.budget.application;

import java.math.BigDecimal; import java.time.LocalDate; import java.util.List;
import org.springframework.http.HttpStatus; import org.springframework.stereotype.Service; import org.springframework.transaction.annotation.Transactional; import org.springframework.web.server.ResponseStatusException;
import com.marrymate.budget.domain.*; import com.marrymate.budget.repository.*; import com.marrymate.identity.application.WorkspaceService;

@Service
public class BudgetService {
    private final BudgetPlanRepository budgets; private final PaymentRepository payments; private final WorkspaceService workspaces; private final com.marrymate.planning.repository.PlanningItemRepository planning; private final com.marrymate.planning.repository.VenueReviewRepository reviews;
    public BudgetService(BudgetPlanRepository budgets,PaymentRepository payments,WorkspaceService workspaces,com.marrymate.planning.repository.PlanningItemRepository planning,com.marrymate.planning.repository.VenueReviewRepository reviews){this.budgets=budgets;this.payments=payments;this.workspaces=workspaces;this.planning=planning;this.reviews=reviews;}
    @Transactional(readOnly=true) public BudgetView get(Long workspaceId,Long userId){workspaces.requireMember(workspaceId,userId); return view(workspaceId);}
    @Transactional public BudgetView changeTarget(Long workspaceId,Long userId,BigDecimal amount){workspaces.requireMember(workspaceId,userId); if(amount.signum()<0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"예산은 0원 이상이어야 합니다."); BudgetPlan plan=budgets.findByWorkspaceId(workspaceId).orElseGet(()->budgets.save(new BudgetPlan(workspaceId))); plan.changeTarget(amount); return view(workspaceId);}
    @Transactional public PaymentView addPayment(Long workspaceId,Long userId,CreatePayment command){workspaces.requireMember(workspaceId,userId); if(command.scheduledAmount().signum()<=0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"결제 금액은 0원보다 커야 합니다."); Payment payment=payments.save(new Payment(workspaceId,command.category(),command.title(),command.type(),command.scheduledAmount(),command.dueDate(),command.payer(),command.memo())); return PaymentView.from(payment);}
    @Transactional public PaymentView complete(Long workspaceId,Long userId,Long paymentId,BigDecimal actualAmount,LocalDate paidDate,String payer){workspaces.requireMember(workspaceId,userId); Payment payment=payments.findByIdAndWorkspaceId(paymentId,workspaceId).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"결제 내역을 찾지 못했습니다.")); if("CANCELLED".equals(payment.getStatus())) throw new ResponseStatusException(HttpStatus.CONFLICT,"취소된 결제 일정은 납입 완료로 바꿀 수 없어요."); if(payer==null || payer.isBlank() || "미정".equals(payer)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"낸 사람을 선택해 주세요."); payment.complete(actualAmount,paidDate,payer); return PaymentView.from(payment);}
    @Transactional public BudgetView preferences(Long workspaceId, Long userId, boolean honeymoon, boolean gifts, BigDecimal giftAmount) {
        workspaces.requireMember(workspaceId,userId);
        BudgetPlan plan=budgets.findByWorkspaceId(workspaceId).orElseGet(()->budgets.save(new BudgetPlan(workspaceId)));
        plan.preferences(honeymoon,gifts,giftAmount); return view(workspaceId);
    }
    @Transactional public BudgetView contract(Long workspaceId, Long userId, Long itemId, List<ContractStage> stages) {
        return contract(workspaceId,userId,itemId,stages,null);
    }
    @Transactional public BudgetView contract(Long workspaceId, Long userId, Long itemId, List<ContractStage> stages, BigDecimal revisedTotal) {
        return contract(workspaceId,userId,itemId,stages,revisedTotal,null);
    }
    @Transactional public BudgetView contract(Long workspaceId, Long userId, Long itemId, List<ContractStage> stages, BigDecimal revisedTotal, VenueTerms venueTerms) {
        return contract(workspaceId,userId,itemId,stages,revisedTotal,venueTerms,null);
    }
    @Transactional public BudgetView contract(Long workspaceId, Long userId, Long itemId, List<ContractStage> stages, BigDecimal revisedTotal, VenueTerms venueTerms, GiftEstimate giftEstimate) {
        workspaces.requireMember(workspaceId,userId);
        var item=planning.findByIdAndWorkspaceId(itemId,workspaceId).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"계약을 찾지 못했어요."));
        if(item.getPackageParentId()!=null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"패키지 계약에서 결제를 관리해 주세요.");
        if(stages.size()!=3 || stages.stream().map(ContractStage::type).distinct().count()!=3) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"계약금·중도금·잔금을 각각 입력해 주세요.");
        if(!java.util.List.of("CONTRACTED","DONE").contains(item.getStatus())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"업체를 확정한 뒤 결제를 연결해 주세요.");
        boolean venueTermsChanged=venueTerms!=null && (item.getVenueMealPrice()==null || item.getVenueGuarantee()==null || item.getVenueRentalFee()==null
            || item.getVenueMealPrice().compareTo(venueTerms.mealPrice())!=0 || !item.getVenueGuarantee().equals(venueTerms.guarantee()) || item.getVenueRentalFee().compareTo(venueTerms.rentalFee())!=0);
        if(venueTerms!=null) item.changeVenueTerms(venueTerms.mealPrice(),venueTerms.guarantee(),venueTerms.rentalFee());
        BigDecimal expected=item.isPackageContract()?item.getPackageBaseAmount():item.getQuotedAmount();
        if("웨딩홀".equals(item.getServiceGroup()) && item.getContractAmountOverride()==null) {
            var consultation=reviews.findAllByWorkspaceIdOrderByCreatedAtDesc(workspaceId).stream().filter(r->itemId.equals(r.getPlanningItemId()) && "CONSULTATION".equals(r.getReviewType())).findFirst();
            if(consultation.isPresent()) { var r=consultation.get(); expected=r.getMealPrice().multiply(BigDecimal.valueOf(r.getMinimumGuarantee())).add(r.getRentalFee()); }
        }
        if(item.getContractAmountOverride()!=null && "웨딩홀".equals(item.getServiceGroup())) expected=item.getContractAmountOverride();
        BigDecimal total=stages.stream().map(ContractStage::amount).reduce(BigDecimal.ZERO,BigDecimal::add);
        if(venueTerms!=null && (venueTermsChanged || item.getContractAmountOverride()==null)) expected=venueTerms.mealPrice().multiply(BigDecimal.valueOf(venueTerms.guarantee())).add(venueTerms.rentalFee());
        if(revisedTotal!=null) {
            if(revisedTotal.signum()<=0 || revisedTotal.precision()>15 || revisedTotal.stripTrailingZeros().scale()>0 || revisedTotal.compareTo(total)!=0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"변경할 총액은 납입 합계와 같고 0원보다 커야 해요.");
            item.reviseContractAmount(revisedTotal); expected=revisedTotal;
            if(item.getQuotedAmount().precision()>15) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"추가금을 포함한 총액이 입력 범위를 초과했어요.");
        }
        if(total.compareTo(expected)!=0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"계약금·중도금·잔금 합계를 계약 총액과 맞춰주세요.");
        if(venueTerms!=null && item.getContractAmountOverride()==null) item.reviseContractAmount(expected);
        var existing=payments.findAllByWorkspaceIdOrderByDueDateAsc(workspaceId);
        for(var stage:stages) {
            var found=existing.stream().filter(p->itemId.equals(p.getPlanningItemId()) && stage.type().equals(p.getType())).findFirst();
            if(stage.amount().signum()==0) { found.ifPresent(payments::delete); continue; }
            if(stage.date()==null || (stage.paid() && stage.paidDate()==null)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"결제 날짜를 입력해 주세요.");
            if(stage.paid() && (stage.payer()==null || stage.payer().isBlank() || "미정".equals(stage.payer()))) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"낸 사람을 선택해 주세요.");
            Payment payment=found.orElseGet(()->new Payment(workspaceId,item.getServiceGroup(),(item.getVendorName().isBlank()?item.getItemName():item.getVendorName())+" · "+java.util.Map.of("DEPOSIT","계약금","INTERIM","중도금","BALANCE","잔금").get(stage.type()),stage.type(),stage.amount(),stage.date(),stage.payer(),"업체 계약 연결"));
            payment.linkPlanningItem(itemId); payment.revise(stage.amount(),stage.date(),stage.payer(),stage.paid(),stage.paidDate()); payments.save(payment);
        }
        if(giftEstimate!=null) {
            if(!"웨딩홀".equals(item.getServiceGroup())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"예상 축의금은 웨딩홀 계약에서 입력해 주세요.");
            if(giftEstimate.amount()==null || giftEstimate.amount().signum()<0 || giftEstimate.amount().precision()>15 || giftEstimate.amount().stripTrailingZeros().scale()>0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"예상 축의금은 15자리 이하의 원 단위 금액으로 입력해 주세요.");
            BudgetPlan plan=budgets.findByWorkspaceId(workspaceId).orElseGet(()->budgets.save(new BudgetPlan(workspaceId)));
            plan.preferences(plan.isIncludeHoneymoon(),giftEstimate.deduct(),giftEstimate.amount());
        }
        return view(workspaceId);
    }
    public record GiftEstimate(@jakarta.validation.constraints.NotNull @jakarta.validation.constraints.PositiveOrZero @jakarta.validation.constraints.Digits(integer=15,fraction=0) BigDecimal amount,boolean deduct) {}
    public record VenueTerms(@jakarta.validation.constraints.NotNull @jakarta.validation.constraints.PositiveOrZero @jakarta.validation.constraints.Digits(integer=15,fraction=0) BigDecimal mealPrice,@jakarta.validation.constraints.NotNull @jakarta.validation.constraints.PositiveOrZero Integer guarantee,@jakarta.validation.constraints.NotNull @jakarta.validation.constraints.PositiveOrZero @jakarta.validation.constraints.Digits(integer=15,fraction=0) BigDecimal rentalFee) {}
    public record ContractStage(@jakarta.validation.constraints.Pattern(regexp="DEPOSIT|INTERIM|BALANCE") @jakarta.validation.constraints.NotNull String type,@jakarta.validation.constraints.NotNull @jakarta.validation.constraints.PositiveOrZero @jakarta.validation.constraints.Digits(integer=15,fraction=0) BigDecimal amount,LocalDate date,boolean paid,LocalDate paidDate,@jakarta.validation.constraints.NotBlank String payer) {}
    private BudgetView view(Long workspaceId){BudgetPlan plan=budgets.findByWorkspaceId(workspaceId).orElse(new BudgetPlan(workspaceId)); BigDecimal target=plan.getTargetAmount(); List<PaymentView> items=payments.findAllByWorkspaceIdOrderByDueDateAsc(workspaceId).stream().map(PaymentView::from).toList(); return new BudgetView(target,items,plan.isIncludeHoneymoon(),plan.isIncludeGifts(),plan.getGiftAmount());}
    public record CreatePayment(String category,String title,String type,BigDecimal scheduledAmount,LocalDate dueDate,String payer,String memo){}
    public record BudgetView(BigDecimal targetAmount,List<PaymentView> payments,boolean includeHoneymoon,boolean includeGifts,BigDecimal giftAmount){}
    public record PaymentView(Long id,String category,String title,String type,String status,BigDecimal scheduledAmount,BigDecimal actualAmount,LocalDate dueDate,LocalDate paidDate,String payer,String memo,Long planningItemId){static PaymentView from(Payment p){return new PaymentView(p.getId(),p.getCategory(),p.getTitle(),p.getType(),p.getStatus(),p.getScheduledAmount(),p.getActualAmount(),p.getDueDate(),p.getPaidDate(),p.getPayer(),p.getMemo(),p.getPlanningItemId());}}
}

