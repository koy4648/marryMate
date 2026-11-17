package com.marrymate.planning.api;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.marrymate.identity.security.CurrentUser;
import com.marrymate.planning.application.VenueReviewService;

@RestController @RequestMapping("/api/v1/venue-reviews")
public class VenueReviewController {
    private final VenueReviewService service; public VenueReviewController(VenueReviewService service){this.service=service;}
    @GetMapping List<VenueReviewService.ReviewView> list(@RequestHeader("X-Workspace-Id") Long workspaceId,@AuthenticationPrincipal CurrentUser user){return service.list(workspaceId,user.id());}
    @PostMapping @ResponseStatus(HttpStatus.CREATED) VenueReviewService.ReviewView create(@RequestHeader("X-Workspace-Id") Long workspaceId,@AuthenticationPrincipal CurrentUser user,@Valid @RequestBody ReviewRequest request){return service.create(workspaceId,user.id(),request.command());}
    @PutMapping("/{reviewId}") VenueReviewService.ReviewView update(@RequestHeader("X-Workspace-Id") Long workspaceId,@AuthenticationPrincipal CurrentUser user,@PathVariable Long reviewId,@Valid @RequestBody ReviewRequest request){return service.update(workspaceId,user.id(),reviewId,request.command());}
    @DeleteMapping("/{reviewId}") @ResponseStatus(HttpStatus.NO_CONTENT) void delete(@RequestHeader("X-Workspace-Id") Long workspaceId,@AuthenticationPrincipal CurrentUser user,@PathVariable Long reviewId){service.delete(workspaceId,user.id(),reviewId);}
    record ReviewRequest(@NotNull Long planningItemId,@NotBlank @Pattern(regexp="SECRET_TOUR|CONSULTATION|GUEST_TOUR") String reviewType,LocalDate visitedDate,@NotBlank @Size(max=10000) String content,@Size(max=1000) String pros,@Size(max=1000) String cons,@PositiveOrZero BigDecimal mealPrice,@PositiveOrZero Integer minimumGuarantee,@PositiveOrZero BigDecimal rentalFee,@Size(max=2000) String serviceItems,@Size(max=2000) String sameDayBenefits){VenueReviewService.ChangeReview command(){return new VenueReviewService.ChangeReview(planningItemId,reviewType,visitedDate,content,pros,cons,mealPrice,minimumGuarantee,rentalFee,serviceItems,sameDayBenefits);}}
}
