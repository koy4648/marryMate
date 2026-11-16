package com.marrymate.budget.api;

import java.math.BigDecimal; import java.time.LocalDate;
import jakarta.validation.Valid; import jakarta.validation.constraints.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal; import org.springframework.web.bind.annotation.*;
import com.marrymate.budget.application.BudgetService; import com.marrymate.identity.security.CurrentUser;

@RestController @RequestMapping("/api/v1/budget")
public class BudgetController {
    private final BudgetService service; public BudgetController(BudgetService service){this.service=service;}
    @GetMapping BudgetService.BudgetView get(@RequestHeader("X-Workspace-Id") Long workspaceId,@AuthenticationPrincipal CurrentUser user){return service.get(workspaceId,user.id());}
    @PutMapping BudgetService.BudgetView target(@RequestHeader("X-Workspace-Id") Long workspaceId,@AuthenticationPrincipal CurrentUser user,@Valid @RequestBody TargetRequest request){return service.changeTarget(workspaceId,user.id(),request.targetAmount());}
    @PostMapping("/payments") BudgetService.PaymentView add(@RequestHeader("X-Workspace-Id") Long workspaceId,@AuthenticationPrincipal CurrentUser user,@Valid @RequestBody PaymentRequest request){return service.addPayment(workspaceId,user.id(),new BudgetService.CreatePayment(request.category(),request.title(),request.type(),request.scheduledAmount(),request.dueDate(),request.payer(),request.memo()));}
    @PatchMapping("/payments/{paymentId}/complete") BudgetService.PaymentView complete(@RequestHeader("X-Workspace-Id") Long workspaceId,@AuthenticationPrincipal CurrentUser user,@PathVariable Long paymentId,@Valid @RequestBody CompleteRequest request){return service.complete(workspaceId,user.id(),paymentId,request.actualAmount(),request.paidDate());}
    record TargetRequest(@NotNull @PositiveOrZero BigDecimal targetAmount){}
    record PaymentRequest(@NotBlank String category,@NotBlank String title,@Pattern(regexp="DEPOSIT|INTERIM|BALANCE|EXTRA|REFUND|OTHER") String type,@NotNull @Positive BigDecimal scheduledAmount,@NotNull LocalDate dueDate,@NotBlank String payer,String memo){}
    record CompleteRequest(@NotNull @PositiveOrZero BigDecimal actualAmount,@NotNull LocalDate paidDate){}
}

