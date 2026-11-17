package com.marrymate.planning.application;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.marrymate.identity.application.WorkspaceService;
import com.marrymate.planning.domain.VenueReview;
import com.marrymate.planning.repository.PlanningItemRepository;
import com.marrymate.planning.repository.VenueReviewRepository;

@Service
public class VenueReviewService {
    private final VenueReviewRepository reviews; private final PlanningItemRepository items; private final WorkspaceService workspaces;
    public VenueReviewService(VenueReviewRepository reviews,PlanningItemRepository items,WorkspaceService workspaces){this.reviews=reviews;this.items=items;this.workspaces=workspaces;}
    @Transactional(readOnly=true) public List<ReviewView> list(Long workspaceId,Long userId){workspaces.requireMember(workspaceId,userId);return reviews.findAllByWorkspaceIdOrderByCreatedAtDesc(workspaceId).stream().map(ReviewView::from).toList();}
    @Transactional public ReviewView create(Long workspaceId,Long userId,ChangeReview command){workspaces.requireMember(workspaceId,userId);var item=items.findByIdAndWorkspaceId(command.planningItemId(),workspaceId).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"웨딩홀 후보를 찾지 못했습니다."));if(!"웨딩홀".equals(item.getServiceGroup()))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"웨딩홀 항목에만 투어 후기를 작성할 수 있습니다.");VenueReview review=new VenueReview(workspaceId,command.planningItemId());apply(review,command);return ReviewView.from(reviews.save(review));}
    @Transactional public ReviewView update(Long workspaceId,Long userId,Long reviewId,ChangeReview command){workspaces.requireMember(workspaceId,userId);VenueReview review=find(workspaceId,reviewId);if(!review.getPlanningItemId().equals(command.planningItemId()))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"후기 대상을 변경할 수 없습니다.");apply(review,command);return ReviewView.from(review);}
    @Transactional public void delete(Long workspaceId,Long userId,Long reviewId){workspaces.requireMember(workspaceId,userId);reviews.delete(find(workspaceId,reviewId));}
    private void apply(VenueReview review,ChangeReview command){BigDecimal meal=zero(command.mealPrice());BigDecimal rental=zero(command.rentalFee());int minimum=command.minimumGuarantee()==null?0:command.minimumGuarantee();if(meal.signum()<0||rental.signum()<0||minimum<0)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"견적 값은 0 이상이어야 합니다.");review.change(command.reviewType(),command.visitedDate(),command.content(),command.pros(),command.cons(),meal,minimum,rental,command.serviceItems(),command.sameDayBenefits());}
    private VenueReview find(Long workspaceId,Long id){return reviews.findByIdAndWorkspaceId(id,workspaceId).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"후기를 찾지 못했습니다."));}
    private BigDecimal zero(BigDecimal value){return value==null?BigDecimal.ZERO:value;}
    public record ChangeReview(Long planningItemId,String reviewType,LocalDate visitedDate,String content,String pros,String cons,BigDecimal mealPrice,Integer minimumGuarantee,BigDecimal rentalFee,String serviceItems,String sameDayBenefits){}
    public record ReviewView(Long id,Long planningItemId,String reviewType,LocalDate visitedDate,String content,String pros,String cons,BigDecimal mealPrice,Integer minimumGuarantee,BigDecimal rentalFee,String serviceItems,String sameDayBenefits){static ReviewView from(VenueReview review){return new ReviewView(review.getId(),review.getPlanningItemId(),review.getReviewType(),review.getVisitedDate(),review.getContent(),review.getPros(),review.getCons(),review.getMealPrice(),review.getMinimumGuarantee(),review.getRentalFee(),review.getServiceItems(),review.getSameDayBenefits());}}
}
