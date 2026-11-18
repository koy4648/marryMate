package com.marrymate.budget;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import com.marrymate.budget.application.BudgetService;
import com.marrymate.identity.application.AuthService;
import com.marrymate.identity.application.WorkspaceService;
import com.marrymate.planning.application.PlanningService;
import com.marrymate.planning.domain.PlanningItem;
import com.marrymate.planning.repository.PlanningItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.server.ResponseStatusException;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties={"spring.jpa.hibernate.ddl-auto=create-drop", "spring.datasource.url=jdbc:h2:mem:shared-budget;MODE=MySQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE"})
@ActiveProfiles("test")
class SharedBudgetTests {
    @Autowired AuthService auth;
    @Autowired BudgetService budgets;
    @Autowired WorkspaceService workspaces;
    @Autowired PlanningService planning;
    @Autowired PlanningItemRepository items;
    Long workspaceId;
    Long userId;
    LocalDate day=LocalDate.of(2026,11,18);

    @BeforeEach void setup() {
        var session=auth.signup(UUID.randomUUID()+"@test.local","test-password","테스트",null);
        workspaceId=session.workspaceId(); userId=session.user().id();
    }
    PlanningItem contract() {
        PlanningItem item=new PlanningItem(workspaceId,"스드메","패키지");
        item.change("스드메","패키지","선택 업체","CONTRACTED",null,new BigDecimal("3200800"),BigDecimal.ZERO,true,new BigDecimal("3000000"),new BigDecimal("200800"),"스튜디오 드레스","",null,"NONE","","","","");
        return items.save(item);
    }
    List<BudgetService.ContractStage> stages(LocalDate date) {
        return List.of(new BudgetService.ContractStage("DEPOSIT",new BigDecimal("320080"),date,true,day,"공동"),new BudgetService.ContractStage("INTERIM",new BigDecimal("1280320"),date,false,null,"공동"),new BudgetService.ContractStage("BALANCE",new BigDecimal("1600400"),date,false,null,"공동"));
    }
    @Test void exactWonPaymentsAreUpdatedWithoutDuplicates() {
        var item=contract();
        var first=budgets.contract(workspaceId,userId,item.getId(),stages(day));
        assertEquals(3,first.payments().size());
        var updated=budgets.contract(workspaceId,userId,item.getId(),stages(day.plusDays(10)));
        assertEquals(3,updated.payments().size());
        assertEquals(first.payments().stream().map(BudgetService.PaymentView::id).sorted().toList(),updated.payments().stream().map(BudgetService.PaymentView::id).sorted().toList());
        assertTrue(updated.payments().stream().allMatch(p->p.planningItemId().equals(item.getId()) && p.dueDate().equals(day.plusDays(10))));
        assertEquals(0,new BigDecimal("3200800").compareTo(updated.payments().stream().map(BudgetService.PaymentView::scheduledAmount).reduce(BigDecimal.ZERO,BigDecimal::add)));
    }
    @Test void invalidBatchDoesNotLeaveHalfSavedPayments() {
        var item=contract();
        var drafts=new java.util.ArrayList<>(stages(day));
        drafts.set(1,new BudgetService.ContractStage("INTERIM",new BigDecimal("1280320"),null,false,null,"공동"));
        assertThrows(ResponseStatusException.class,()->budgets.contract(workspaceId,userId,item.getId(),drafts));
        assertTrue(budgets.get(workspaceId,userId).payments().isEmpty());
    }
    @Test void preferencesAndHomeCopyAreSharedAndPersisted() {
        budgets.preferences(workspaceId,userId,false,true,new BigDecimal("1234567"));
        var budget=budgets.get(workspaceId,userId);
        assertFalse(budget.includeHoneymoon()); assertTrue(budget.includeGifts());
        assertEquals(0,new BigDecimal("1234567").compareTo(budget.giftAmount()));
        workspaces.rename(workspaceId,userId,"우리 공간",day,"우리의 기록","오늘도 같이");
        var workspace=workspaces.list(userId).getFirst();
        assertEquals(day,workspace.weddingDate()); assertEquals("우리의 기록",workspace.homeTitle()); assertEquals("오늘도 같이",workspace.homeMessage());
    }
    @Test void confirmedPackageConnectsUntouchedChecklistTemplates() {
        planning.list(workspaceId,userId); var parent=contract();
        var child=planning.list(workspaceId,userId).stream().filter(i->i.serviceGroup().equals("스튜디오") && i.itemName().equals("드레스")).findFirst().orElseThrow();
        assertEquals(parent.getId(),child.packageParentId());
    }
    @Test void unrelatedUserCannotChangeContractPayments() {
        var item=contract(); var other=auth.signup(UUID.randomUUID()+"@test.local","test-password","다른 사용자",null);
        assertThrows(ResponseStatusException.class,()->budgets.contract(workspaceId,other.user().id(),item.getId(),stages(day)));
    }
}
