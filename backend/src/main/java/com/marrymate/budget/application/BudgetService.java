package com.marrymate.budget.application;

import java.math.BigDecimal; import java.time.LocalDate; import java.util.List;
import org.springframework.http.HttpStatus; import org.springframework.stereotype.Service; import org.springframework.transaction.annotation.Transactional; import org.springframework.web.server.ResponseStatusException;
import com.marrymate.budget.domain.*; import com.marrymate.budget.repository.*; import com.marrymate.identity.application.WorkspaceService;

@Service
public class BudgetService {
    private final BudgetPlanRepository budgets; private final PaymentRepository payments; private final WorkspaceService workspaces;
    public BudgetService(BudgetPlanRepository budgets,PaymentRepository payments,WorkspaceService workspaces){this.budgets=budgets;this.payments=payments;this.workspaces=workspaces;}
    @Transactional(readOnly=true) public BudgetView get(Long workspaceId,Long userId){workspaces.requireMember(workspaceId,userId); return view(workspaceId);}
    @Transactional public BudgetView changeTarget(Long workspaceId,Long userId,BigDecimal amount){workspaces.requireMember(workspaceId,userId); if(amount.signum()<0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"예산은 0원 이상이어야 합니다."); BudgetPlan plan=budgets.findByWorkspaceId(workspaceId).orElseGet(()->budgets.save(new BudgetPlan(workspaceId))); plan.changeTarget(amount); return view(workspaceId);}
    @Transactional public PaymentView addPayment(Long workspaceId,Long userId,CreatePayment command){workspaces.requireMember(workspaceId,userId); if(command.scheduledAmount().signum()<=0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"결제 금액은 0원보다 커야 합니다."); Payment payment=payments.save(new Payment(workspaceId,command.category(),command.title(),command.type(),command.scheduledAmount(),command.dueDate(),command.payer(),command.memo())); return PaymentView.from(payment);}
    @Transactional public PaymentView complete(Long workspaceId,Long userId,Long paymentId,BigDecimal actualAmount,LocalDate paidDate){workspaces.requireMember(workspaceId,userId); Payment payment=payments.findByIdAndWorkspaceId(paymentId,workspaceId).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"결제 내역을 찾지 못했습니다.")); payment.complete(actualAmount,paidDate); return PaymentView.from(payment);}
    private BudgetView view(Long workspaceId){BigDecimal target=budgets.findByWorkspaceId(workspaceId).map(BudgetPlan::getTargetAmount).orElse(BigDecimal.ZERO); List<PaymentView> items=payments.findAllByWorkspaceIdOrderByDueDateAsc(workspaceId).stream().map(PaymentView::from).toList(); return new BudgetView(target,items);}
    public record CreatePayment(String category,String title,String type,BigDecimal scheduledAmount,LocalDate dueDate,String payer,String memo){}
    public record BudgetView(BigDecimal targetAmount,List<PaymentView> payments){}
    public record PaymentView(Long id,String category,String title,String type,String status,BigDecimal scheduledAmount,BigDecimal actualAmount,LocalDate dueDate,LocalDate paidDate,String payer,String memo){static PaymentView from(Payment p){return new PaymentView(p.getId(),p.getCategory(),p.getTitle(),p.getType(),p.getStatus(),p.getScheduledAmount(),p.getActualAmount(),p.getDueDate(),p.getPaidDate(),p.getPayer(),p.getMemo());}}
}

