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

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT,properties={"spring.jpa.hibernate.ddl-auto=create-drop", "spring.datasource.url=jdbc:h2:mem:shared-budget;MODE=MySQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE"})
@ActiveProfiles("test")
class SharedBudgetTests {
    @Autowired AuthService auth;
    @Autowired BudgetService budgets;
    @Autowired WorkspaceService workspaces;
    @Autowired PlanningService planning;
    @Autowired PlanningItemRepository items;
    @Autowired com.marrymate.budget.repository.PaymentRepository paymentRecords;
    @Autowired com.marrymate.planning.repository.VenueReviewRepository venueReviews;
    @org.springframework.beans.factory.annotation.Value("${local.server.port}") int port;
    Long workspaceId;
    Long userId;
    String email;
    LocalDate day=LocalDate.of(2026,11,18);

    @BeforeEach void setup() {
        email=UUID.randomUUID()+"@test.local";
        var session=auth.signup(email,"test-password","테스트");
        userId=session.user().id(); workspaceId=workspaces.create(userId,"테스트의 결혼 준비",null).id();
    }
    PlanningItem contract() {
        PlanningItem item=new PlanningItem(workspaceId,"스드메","패키지");
        item.change("스드메","패키지","선택 업체","CONTRACTED",null,new BigDecimal("3200800"),BigDecimal.ZERO,true,new BigDecimal("3200800"),BigDecimal.ZERO,"스튜디오 드레스","",null,"NONE","","","","");
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
    @Test void onlyPaidInstallmentsKeepTheirPayerWhenSavedAndRevised() {
        var item=contract();
        var payers=List.of("신랑","신부","신부 측 부모님");
        var separate=java.util.stream.IntStream.range(0,3).mapToObj(i->{
            var stage=stages(day).get(i);
            return new BudgetService.ContractStage(stage.type(),stage.amount(),stage.date(),stage.paid(),stage.paidDate(),payers.get(i));
        }).toList();
        budgets.contract(workspaceId,userId,item.getId(),separate);
        var saved=budgets.get(workspaceId,userId).payments();
        for(int i=0;i<3;i++) {
            final var stage=separate.get(i);
            assertEquals(stage.paid()?payers.get(i):"미정",saved.stream().filter(p->p.type().equals(stage.type())).findFirst().orElseThrow().payer());
        }
        var changed=new java.util.ArrayList<>(separate);
        var balance=separate.get(2);
        changed.set(2,new BudgetService.ContractStage(balance.type(),balance.amount(),day,true,day,"신랑 측 부모님"));
        budgets.contract(workspaceId,userId,item.getId(),changed);
        var revised=budgets.get(workspaceId,userId).payments();
        assertEquals(3,revised.size());
        assertEquals("신랑",revised.stream().filter(p->p.type().equals("DEPOSIT")).findFirst().orElseThrow().payer());
        var paidBalance=revised.stream().filter(p->p.type().equals("BALANCE")).findFirst().orElseThrow();
        assertEquals("신랑 측 부모님",paidBalance.payer()); assertEquals("PAID",paidBalance.status());
    }
    @Test void scheduledPaymentGetsPayerOnlyWhenCompletedAndClearsItWhenReopened() {
        var payment=budgets.addPayment(workspaceId,userId,new BudgetService.CreatePayment("기타","예정 결제","OTHER",new BigDecimal("10000"),day.minusDays(1),"신부",""));
        assertEquals("미정",payment.payer());
        var paid=budgets.complete(workspaceId,userId,payment.id(),new BigDecimal("10000"),day,"신랑");
        assertEquals("신랑",paid.payer()); assertEquals("PAID",paid.status());
        var record=paymentRecords.findById(payment.id()).orElseThrow();
        record.revise(new BigDecimal("10000"),day,"신랑",false,null); paymentRecords.save(record);
        assertEquals("미정",budgets.get(workspaceId,userId).payments().stream().filter(p->p.id().equals(payment.id())).findFirst().orElseThrow().payer());
    }
    @Test void totalChangeRequiresConfirmationAndUpdatesPackageBaseWithPaymentsAtomically() {
        var item=contract();
        var changed=new java.util.ArrayList<>(stages(day));
        changed.set(2,new BudgetService.ContractStage("BALANCE",new BigDecimal("1700400"),day,false,null,"신부"));
        assertThrows(ResponseStatusException.class,()->budgets.contract(workspaceId,userId,item.getId(),changed));
        assertEquals(0,new BigDecimal("3200800").compareTo(items.findById(item.getId()).orElseThrow().getPackageBaseAmount()));
        var saved=budgets.contract(workspaceId,userId,item.getId(),changed,new BigDecimal("3300800"));
        assertEquals(0,new BigDecimal("3300800").compareTo(items.findById(item.getId()).orElseThrow().getPackageBaseAmount()));
        assertEquals(0,new BigDecimal("3300800").compareTo(saved.payments().stream().map(BudgetService.PaymentView::scheduledAmount).reduce(BigDecimal.ZERO,BigDecimal::add)));
        budgets.contract(workspaceId,userId,item.getId(),changed);
        assertEquals(3,budgets.get(workspaceId,userId).payments().size());
    }
    @Test void invalidScheduleRollsBackTheConfirmedTotalChangeAsWell() {
        var item=contract();
        var changed=new java.util.ArrayList<>(stages(day));
        changed.set(2,new BudgetService.ContractStage("BALANCE",new BigDecimal("1700400"),null,false,null,"신부"));
        assertThrows(ResponseStatusException.class,()->budgets.contract(workspaceId,userId,item.getId(),changed,new BigDecimal("3300800")));
        assertEquals(0,new BigDecimal("3200800").compareTo(items.findById(item.getId()).orElseThrow().getPackageBaseAmount()));
        assertTrue(budgets.get(workspaceId,userId).payments().isEmpty());
        assertThrows(ResponseStatusException.class,()->budgets.contract(workspaceId,userId,item.getId(),stages(day),new BigDecimal("1")));
    }
    @Test void revisingPackageBaseKeepsAdditionalChargesSeparate() {
        var parent=planning.create(workspaceId,userId,new PlanningService.ChangeItem("패키지","웨딩 패키지","업체","CONTRACTED",null,BigDecimal.ZERO,BigDecimal.ZERO,true,new BigDecimal("1000000"),BigDecimal.ZERO,"","",null,"NONE","","","","",null,null,new BigDecimal("15000"),"공통 옵션",day));
        budgets.contract(workspaceId,userId,parent.id(),stages(day),new BigDecimal("3200800"));
        var updated=items.findById(parent.id()).orElseThrow();
        assertEquals(0,new BigDecimal("15000").compareTo(updated.getPackageAdditionalAmount()));
        assertEquals(0,new BigDecimal("3215800").compareTo(updated.getQuotedAmount()));
        assertEquals(4,budgets.get(workspaceId,userId).payments().size());
    }
    @Test void venueTotalOverridePersistsWithoutChangingConsultationHistory() {
        var item=items.save(new PlanningItem(workspaceId,"웨딩홀","웨딩홀 투어")); item.contract(); items.save(item);
        var review=new com.marrymate.planning.domain.VenueReview(workspaceId,item.getId());
        review.change("CONSULTATION",day,"상담 기록","","",new BigDecimal("50000"),100,new BigDecimal("1000000"),"서비스","");
        venueReviews.save(review);
        budgets.contract(workspaceId,userId,item.getId(),stages(day),new BigDecimal("3200800"));
        var updated=planning.list(workspaceId,userId).stream().filter(i->i.id().equals(item.getId())).findFirst().orElseThrow();
        assertEquals(0,new BigDecimal("3200800").compareTo(updated.contractAmountOverride()));
        budgets.contract(workspaceId,userId,item.getId(),stages(day));
        assertEquals(0,new BigDecimal("50000").compareTo(venueReviews.findById(review.getId()).orElseThrow().getMealPrice()));
        assertEquals(3,budgets.get(workspaceId,userId).payments().size());
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
        var child=planning.list(workspaceId,userId).stream().filter(i->i.serviceGroup().equals("스튜디오 촬영") && i.itemName().equals("드레스")).findFirst().orElseThrow();
        assertEquals(parent.getId(),child.packageParentId());
    }
    @Test void packagesUseOneCategoryRegardlessOfOriginalService() {
        var saved=planning.create(workspaceId,userId,new PlanningService.ChangeItem("스튜디오 촬영","촬영 묶음","함께 업체","RESEARCHING",null,BigDecimal.ZERO,BigDecimal.ZERO,true,new BigDecimal("3200800"),BigDecimal.ZERO,"스튜디오 드레스","",null,"NONE","","","","",null,null,null,null,null));
        assertEquals("패키지",saved.serviceGroup());
        assertEquals("촬영 묶음",saved.itemName());
        assertEquals(0,new BigDecimal("3200800").compareTo(saved.quotedAmount()));
    }
    PlanningService.ItemView packageWith(String vendor,String includes) {
        return planning.create(workspaceId,userId,new PlanningService.ChangeItem("패키지","웨딩 패키지",vendor,"RESEARCHING",null,BigDecimal.ZERO,BigDecimal.ZERO,true,new BigDecimal("1130000"),BigDecimal.ZERO,includes,"",null,"NONE","","","","",null,null,null,null,null));
    }
    @Test void packagesWithTheSameNameHaveTheirOwnItemsAndAreNotCompetingCandidates() {
        planning.list(workspaceId,userId);
        var first=packageWith("다이렉트","스튜디오 촬영|부케|특별 서비스");
        var second=packageWith("더라운지","스튜디오 촬영|DVD");
        var all=planning.list(workspaceId,userId);
        assertEquals(4,all.stream().filter(i->first.id().equals(i.packageParentId())).count());
        assertEquals(3,all.stream().filter(i->second.id().equals(i.packageParentId())).count());
        assertEquals(all.size(),planning.list(workspaceId,userId).size());
        planning.selectCandidate(workspaceId,userId,first.id());
        assertEquals("RESEARCHING",items.findById(second.id()).orElseThrow().getStatus());
    }
    @Test void removingInclusionPreservesRecordedPreparationButUnlinksIt() {
        var parent=packageWith("다이렉트","DVD|아이폰 스냅");
        var child=planning.list(workspaceId,userId).stream().filter(i->parent.id().equals(i.packageParentId())&&i.itemName().equals("DVD")).findFirst().orElseThrow();
        planning.update(workspaceId,userId,child.id(),new PlanningService.ChangeItem(child.serviceGroup(),child.itemName(),"촬영 업체","SCHEDULED",day,BigDecimal.ZERO,BigDecimal.ZERO,false,BigDecimal.ZERO,BigDecimal.ZERO,"","",null,"NONE","","","","방문 기록",parent.id(),null,null,null,null));
        planning.update(workspaceId,userId,parent.id(),new PlanningService.ChangeItem("패키지",parent.itemName(),parent.vendorName(),parent.status(),null,BigDecimal.ZERO,BigDecimal.ZERO,true,parent.packageBaseAmount(),BigDecimal.ZERO,"아이폰 스냅","",null,"NONE","","","","",null,null,null,null,null));
        var saved=items.findById(child.id()).orElseThrow();
        assertNull(saved.getPackageParentId()); assertEquals("방문 기록",saved.getMemo()); assertEquals(day,saved.getScheduleDate());
    }
    @Test void assigningRecordedItemToPackageReplacesOnlyBlankGeneratedPlaceholder() {
        var parent=packageWith("다이렉트","본식 헤어·메이크업");
        var recorded=planning.create(workspaceId,userId,new PlanningService.ChangeItem("본식","헤어·메이크업","헤움","CONTRACTED",day,BigDecimal.ZERO,BigDecimal.ZERO,false,BigDecimal.ZERO,BigDecimal.ZERO,"","",null,"NONE","","","","방문 메모",null,null,null,null,null));
        planning.update(workspaceId,userId,recorded.id(),new PlanningService.ChangeItem("본식","헤어·메이크업","헤움","CONTRACTED",day,new BigDecimal("100000"),BigDecimal.ZERO,false,BigDecimal.ZERO,BigDecimal.ZERO,"","",null,"NONE","","","","방문 메모",parent.id(),null,null,null,null));
        var linked=planning.list(workspaceId,userId).stream().filter(i->parent.id().equals(i.packageParentId())).toList();
        assertEquals(1,linked.size()); assertEquals(recorded.id(),linked.getFirst().id());
        assertEquals(day,linked.getFirst().scheduleDate()); assertEquals("방문 메모",linked.getFirst().memo());
        assertEquals(0,BigDecimal.ZERO.compareTo(linked.getFirst().quotedAmount()));
    }
    @Test void assigningKnownPreparationItemAlsoUpdatesParentInclusions() {
        var parent=packageWith("다이렉트","DVD");
        var linked=planning.create(workspaceId,userId,new PlanningService.ChangeItem("본식","헤어·메이크업","헤움","CONTRACTED",day,BigDecimal.ZERO,BigDecimal.ZERO,false,BigDecimal.ZERO,BigDecimal.ZERO,"","",null,"NONE","","","","",parent.id(),null,null,null,null));
        assertEquals(parent.id(),linked.packageParentId());
        assertTrue(items.findById(parent.id()).orElseThrow().getPackageIncludedItems().contains("본식 헤어·메이크업"));
        assertEquals(2,planning.list(workspaceId,userId).stream().filter(i->parent.id().equals(i.packageParentId())).count());
    }
    PlanningService.ChangeItem visit(LocalDate date,java.time.LocalTime time) {
        return new PlanningService.ChangeItem("본식","헤어·메이크업","헤움","SCHEDULED",date,BigDecimal.ZERO,BigDecimal.ZERO,false,BigDecimal.ZERO,BigDecimal.ZERO,"","",null,"NONE","","","","방문 메모",null,time,null,null,null);
    }
    @Test void visitTimePersistsAndCanBeChangedOrClearedWithoutChangingTheDate() {
        var morning=java.time.LocalTime.of(6,30);
        var saved=planning.create(workspaceId,userId,visit(day,morning));
        assertEquals(morning,items.findById(saved.id()).orElseThrow().getScheduleTime());
        assertEquals(morning,planning.list(workspaceId,userId).stream().filter(i->i.id().equals(saved.id())).findFirst().orElseThrow().scheduleTime());
        var changed=planning.update(workspaceId,userId,saved.id(),visit(day,java.time.LocalTime.of(21,5)));
        assertEquals(java.time.LocalTime.of(21,5),changed.scheduleTime());
        var cleared=planning.update(workspaceId,userId,saved.id(),visit(day,null));
        assertNull(cleared.scheduleTime()); assertEquals(day,cleared.scheduleDate()); assertEquals("방문 메모",cleared.memo());
    }
    @Test void aVisitTimeRequiresADate() {
        assertThrows(ResponseStatusException.class,()->planning.create(workspaceId,userId,visit(null,java.time.LocalTime.NOON)));
        assertFalse(items.existsByWorkspaceId(workspaceId));
    }
    PlanningService.ChangeItem extraItem(Long parent,String status,long amount,LocalDate due) {
        return new PlanningService.ChangeItem("스튜디오 촬영","드레스","추가금 업체",status,null,new BigDecimal("1000000"),BigDecimal.ZERO,false,BigDecimal.ZERO,BigDecimal.ZERO,"","",null,"NONE","","","","",parent,null,BigDecimal.valueOf(amount),"업그레이드",due);
    }
    @Test void ordinaryExtraPaymentIsUpdatedWithoutDuplicatesAndKeepsPaidHistory() {
        var item=planning.create(workspaceId,userId,extraItem(null,"CONTRACTED",12345,day));
        var first=budgets.get(workspaceId,userId).payments().getFirst();
        assertEquals("EXTRA",first.type()); assertEquals(item.id(),first.planningItemId());
        planning.update(workspaceId,userId,item.id(),extraItem(null,"CONTRACTED",15000,day.plusDays(1)));
        var updated=budgets.get(workspaceId,userId).payments();
        assertEquals(1,updated.size()); assertEquals(first.id(),updated.getFirst().id()); assertEquals(day.plusDays(1),updated.getFirst().dueDate());
        budgets.complete(workspaceId,userId,first.id(),new BigDecimal("15000"),day,"신부");
        planning.update(workspaceId,userId,item.id(),extraItem(null,"CONTRACTED",15000,day.plusDays(1)));
        assertEquals("PAID",budgets.get(workspaceId,userId).payments().getFirst().status());
        assertThrows(ResponseStatusException.class,()->planning.update(workspaceId,userId,item.id(),extraItem(null,"CONTRACTED",0,null)));
        assertEquals(0,new BigDecimal("15000").compareTo(items.findById(item.id()).orElseThrow().getExtraAmount()));
    }
    @Test void provisionalExtrasBecomePaymentsWhenTheVendorIsSelected() {
        var item=planning.create(workspaceId,userId,extraItem(null,"RESEARCHING",12345,day));
        assertTrue(budgets.get(workspaceId,userId).payments().isEmpty());
        planning.selectCandidate(workspaceId,userId,item.id());
        assertEquals(1,budgets.get(workspaceId,userId).payments().size());
    }
    @Test void linkingHelperToPackageCancelsUnpaidIndividualBalanceAndKeepsExtra() {
        var parent=contract();
        var helper=planning.create(workspaceId,userId,new PlanningService.ChangeItem("본식","헬퍼","헬퍼 업체","CONTRACTED",null,new BigDecimal("300000"),BigDecimal.ZERO,false,BigDecimal.ZERO,BigDecimal.ZERO,"","",null,"NONE","","","","",null,null,new BigDecimal("300000"),"헬퍼비",day));
        var balance=new com.marrymate.budget.domain.Payment(workspaceId,"본식","헬퍼 잔금","BALANCE",new BigDecimal("300000"),day,"신랑","");
        balance.linkPlanningItem(helper.id()); paymentRecords.save(balance);
        var linked=planning.update(workspaceId,userId,helper.id(),new PlanningService.ChangeItem("본식","헬퍼","헬퍼 업체","CONTRACTED",null,BigDecimal.ZERO,BigDecimal.ZERO,false,BigDecimal.ZERO,BigDecimal.ZERO,"","",null,"NONE","","","","",parent.getId(),null,new BigDecimal("300000"),"헬퍼비",day));
        assertEquals(parent.getId(),linked.packageParentId());
        assertEquals("CANCELLED",paymentRecords.findById(balance.getId()).orElseThrow().getStatus());
        assertThrows(ResponseStatusException.class,()->budgets.complete(workspaceId,userId,balance.getId(),new BigDecimal("300000"),day,"신랑"));
        var extra=budgets.get(workspaceId,userId).payments().stream().filter(p->helper.id().equals(p.planningItemId())&&"EXTRA".equals(p.type())).toList();
        assertEquals(1,extra.size()); assertEquals(0,new BigDecimal("300000").compareTo(extra.getFirst().scheduledAmount()));
        assertTrue(items.findById(parent.getId()).orElseThrow().getPackageIncludedItems().contains("본식 헬퍼"));
        assertEquals(1,planning.list(workspaceId,userId).stream().filter(p->parent.getId().equals(p.packageParentId())&&p.itemName().equals("헬퍼")&&p.serviceGroup().equals("본식")).count());
    }
    @Test void paidIndividualBalanceBlocksLinkingWithoutChangingAnyRecords() {
        var parent=contract();
        var helper=planning.create(workspaceId,userId,extraItem(null,"CONTRACTED",300000,day));
        var balance=new com.marrymate.budget.domain.Payment(workspaceId,"스튜디오 촬영","개별 잔금","BALANCE",new BigDecimal("300000"),day,"신랑","");
        balance.linkPlanningItem(helper.id()); balance.complete(new BigDecimal("100000"),day,"신랑"); paymentRecords.save(balance);
        var failure=assertThrows(ResponseStatusException.class,()->planning.update(workspaceId,userId,helper.id(),extraItem(parent.getId(),"CONTRACTED",300000,day)));
        assertTrue(failure.getReason().contains("이미 납부"));
        assertNull(items.findById(helper.id()).orElseThrow().getPackageParentId());
        assertEquals("PARTIALLY_PAID",paymentRecords.findById(balance.getId()).orElseThrow().getStatus());
    }
    @Test void packageLinkingApiReturnsAUsefulReasonForPaidPayments() throws Exception {
        var parent=contract();
        var helper=planning.create(workspaceId,userId,extraItem(null,"CONTRACTED",300000,day));
        var balance=new com.marrymate.budget.domain.Payment(workspaceId,"스튜디오 촬영","개별 잔금","BALANCE",new BigDecimal("300000"),day,"신랑","");
        balance.linkPlanningItem(helper.id()); balance.complete(new BigDecimal("100000"),day,"신랑"); paymentRecords.save(balance);
        // Issue an authenticated session for this test user without touching production accounts.
        var token=auth.login(email,"test-password").token();
        var body="""
            {"serviceGroup":"스튜디오 촬영","itemName":"헬퍼","vendorName":"헬퍼 업체","status":"CONTRACTED","packageContract":false,"packageParentId":%d,"extraAmount":300000,"extraDueDate":"2026-11-18"}
            """.formatted(parent.getId());
        var request=java.net.http.HttpRequest.newBuilder(java.net.URI.create("http://localhost:"+port+"/api/v1/planning-items/"+helper.id()))
            .header("Authorization","Bearer "+token).header("X-Workspace-Id",workspaceId.toString()).header("Content-Type","application/json")
            .PUT(java.net.http.HttpRequest.BodyPublishers.ofString(body)).build();
        var response=java.net.http.HttpClient.newHttpClient().send(request,java.net.http.HttpResponse.BodyHandlers.ofString());
        assertEquals(409,response.statusCode());
        assertTrue(response.body().contains("detail")); assertTrue(response.body().contains("이미 납부"));
        assertNull(items.findById(helper.id()).orElseThrow().getPackageParentId());
    }
    @Test void includedItemExtraIsSeparateFromPackageBaseInstallments() {
        var parent=contract();
        var child=planning.create(workspaceId,userId,extraItem(parent.getId(),"TODO",15000,day));
        assertEquals(0,BigDecimal.ZERO.compareTo(child.quotedAmount()));
        var budget=budgets.contract(workspaceId,userId,parent.getId(),stages(day));
        assertEquals(4,budget.payments().size());
        assertEquals(1,budget.payments().stream().filter(payment->"EXTRA".equals(payment.type())&&child.id().equals(payment.planningItemId())).count());
        assertEquals(0,new BigDecimal("3200800").compareTo(items.findById(parent.getId()).orElseThrow().getQuotedAmount()));
    }
    @Test void packageCommonExtraIsNotPartOfBaseInstallmentsTwice() {
        var parent=planning.create(workspaceId,userId,new PlanningService.ChangeItem("패키지","웨딩 패키지","다이렉트","CONTRACTED",null,BigDecimal.ZERO,BigDecimal.ZERO,true,new BigDecimal("1000000"),BigDecimal.ZERO,"","",null,"NONE","","","","",null,null,new BigDecimal("15000"),"공통 옵션",day));
        assertEquals(0,new BigDecimal("1015000").compareTo(parent.quotedAmount()));
        var stages=List.of(new BudgetService.ContractStage("DEPOSIT",new BigDecimal("100000"),day,false,null,"공동"),new BudgetService.ContractStage("INTERIM",new BigDecimal("400000"),day,false,null,"공동"),new BudgetService.ContractStage("BALANCE",new BigDecimal("500000"),day,false,null,"공동"));
        var budget=budgets.contract(workspaceId,userId,parent.id(),stages);
        assertEquals(4,budget.payments().size());
        assertEquals(0,new BigDecimal("1015000").compareTo(budget.payments().stream().map(BudgetService.PaymentView::scheduledAmount).reduce(BigDecimal.ZERO,BigDecimal::add)));
    }
    @Test void venueTermsAndMealInclusiveBalanceAreSavedTogetherWithoutDoubleCounting() {
        var venue=new PlanningItem(workspaceId,"웨딩홀","웨딩홀 투어");
        venue.change("웨딩홀","웨딩홀 투어","테스트 홀","CONTRACTED",null,BigDecimal.ZERO,BigDecimal.ZERO,false,BigDecimal.ZERO,BigDecimal.ZERO,"","",null,"NONE","","","","");
        venue=items.save(venue); final Long id=venue.getId();
        var terms=new BudgetService.VenueTerms(new BigDecimal("70000"),200,new BigDecimal("3000000"));
        var installments=List.of(new BudgetService.ContractStage("DEPOSIT",new BigDecimal("2000000"),day,true,day,"신부"),new BudgetService.ContractStage("INTERIM",new BigDecimal("3000000"),day,false,null,"미정"),new BudgetService.ContractStage("BALANCE",new BigDecimal("12000000"),day.plusMonths(6),false,null,"미정"));
        var first=budgets.contract(workspaceId,userId,id,installments,new BigDecimal("17000000"),terms);
        var reopened=planning.list(workspaceId,userId).stream().filter(item->item.id().equals(id)).findFirst().orElseThrow();
        assertEquals(0,new BigDecimal("70000").compareTo(reopened.venueMealPrice()));
        assertEquals(200,reopened.venueGuarantee()); assertEquals(0,new BigDecimal("3000000").compareTo(reopened.venueRentalFee()));
        assertEquals(0,new BigDecimal("17000000").compareTo(reopened.contractAmountOverride()));
        var repeated=budgets.contract(workspaceId,userId,id,installments,null,terms);
        assertEquals(first.payments().stream().map(BudgetService.PaymentView::id).sorted().toList(),repeated.payments().stream().map(BudgetService.PaymentView::id).sorted().toList());
        assertEquals(0,new BigDecimal("17000000").compareTo(repeated.payments().stream().map(BudgetService.PaymentView::scheduledAmount).reduce(BigDecimal.ZERO,BigDecimal::add)));
        assertEquals("신부",repeated.payments().stream().filter(p->"DEPOSIT".equals(p.type())).findFirst().orElseThrow().payer());
        var invalid=new BudgetService.VenueTerms(new BigDecimal("80000"),200,new BigDecimal("3000000"));
        assertThrows(ResponseStatusException.class,()->budgets.contract(workspaceId,userId,id,installments,null,invalid));
        assertEquals(0,new BigDecimal("70000").compareTo(items.findById(id).orElseThrow().getVenueMealPrice()));
    }
    @Test void confirmingThreeHoneymoonHotelsPreservesEveryBookingAndPayment() {
        var ids=new java.util.ArrayList<Long>();
        for(int i=1;i<=3;i++) {
            var hotel=planning.create(workspaceId,userId,new PlanningService.ChangeItem("신혼여행","숙소","호텔 "+i,"RESEARCHING",null,new BigDecimal("1000000"),BigDecimal.ZERO,false,BigDecimal.ZERO,BigDecimal.ZERO,"","",null,"NONE","","","","",null,null,BigDecimal.ZERO,"",null));
            ids.add(hotel.id());
            planning.selectCandidate(workspaceId,userId,hotel.id());
            var schedule=List.of(new BudgetService.ContractStage("DEPOSIT",new BigDecimal("100000"),day,true,day,"신부"),new BudgetService.ContractStage("INTERIM",BigDecimal.ZERO,null,false,null,"미정"),new BudgetService.ContractStage("BALANCE",new BigDecimal("900000"),day.plusMonths(1),false,null,"미정"));
            budgets.contract(workspaceId,userId,hotel.id(),schedule);
        }
        var all=planning.list(workspaceId,userId);
        assertEquals(3,all.stream().filter(item->ids.contains(item.id())&&"CONTRACTED".equals(item.status())).count());
        assertEquals(6,budgets.get(workspaceId,userId).payments().size());
        assertEquals(0,new BigDecimal("3000000").compareTo(budgets.get(workspaceId,userId).payments().stream().map(BudgetService.PaymentView::scheduledAmount).reduce(BigDecimal.ZERO,BigDecimal::add)));
    }
    @Test void unrelatedUserCannotChangeContractPayments() {
        var item=contract(); var other=auth.signup(UUID.randomUUID()+"@test.local","test-password","다른 사용자");
        assertThrows(ResponseStatusException.class,()->budgets.contract(workspaceId,other.user().id(),item.getId(),stages(day)));
    }
}
