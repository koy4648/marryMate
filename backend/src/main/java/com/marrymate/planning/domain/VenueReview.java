package com.marrymate.planning.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import jakarta.persistence.*;

@Entity
@Table(name = "venue_reviews")
public class VenueReview {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "workspace_id", nullable = false) private Long workspaceId;
    @Column(name = "planning_item_id", nullable = false) private Long planningItemId;
    @Column(name = "review_type", nullable = false, length = 30) private String reviewType;
    @Column(name = "visited_date") private LocalDate visitedDate;
    @Column(nullable = false, columnDefinition = "TEXT") private String content;
    @Column(nullable = false, length = 1000) private String pros;
    @Column(nullable = false, length = 1000) private String cons;
    @Column(name = "meal_price", nullable = false, precision = 15, scale = 0) private BigDecimal mealPrice;
    @Column(name = "minimum_guarantee", nullable = false) private Integer minimumGuarantee;
    @Column(name = "rental_fee", nullable = false, precision = 15, scale = 0) private BigDecimal rentalFee;
    @Column(name = "service_items", nullable = false, length = 2000) private String serviceItems;
    @Column(name = "same_day_benefits", nullable = false, length = 2000) private String sameDayBenefits;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;

    protected VenueReview() {}
    public VenueReview(Long workspaceId, Long planningItemId) {
        this.workspaceId=workspaceId; this.planningItemId=planningItemId; this.reviewType="SECRET_TOUR";
        this.content=""; this.pros=""; this.cons=""; this.mealPrice=BigDecimal.ZERO; this.minimumGuarantee=0;
        this.rentalFee=BigDecimal.ZERO; this.serviceItems=""; this.sameDayBenefits="";
        this.createdAt=Instant.now(); this.updatedAt=this.createdAt;
    }
    public void change(String reviewType, LocalDate visitedDate, String content, String pros, String cons,
                       BigDecimal mealPrice, Integer minimumGuarantee, BigDecimal rentalFee,
                       String serviceItems, String sameDayBenefits) {
        this.reviewType=reviewType; this.visitedDate=visitedDate; this.content=value(content); this.pros=value(pros); this.cons=value(cons);
        boolean consultation="CONSULTATION".equals(reviewType);
        this.mealPrice=consultation && mealPrice!=null ? mealPrice : BigDecimal.ZERO;
        this.minimumGuarantee=consultation && minimumGuarantee!=null ? minimumGuarantee : 0;
        this.rentalFee=consultation && rentalFee!=null ? rentalFee : BigDecimal.ZERO;
        this.serviceItems=consultation ? value(serviceItems) : "";
        this.sameDayBenefits=consultation ? value(sameDayBenefits) : "";
        this.updatedAt=Instant.now();
    }
    private static String value(String value) { return value == null ? "" : value.trim(); }
    public Long getId(){return id;} public Long getPlanningItemId(){return planningItemId;} public String getReviewType(){return reviewType;}
    public LocalDate getVisitedDate(){return visitedDate;} public String getContent(){return content;} public String getPros(){return pros;}
    public String getCons(){return cons;} public BigDecimal getMealPrice(){return mealPrice;} public Integer getMinimumGuarantee(){return minimumGuarantee;}
    public BigDecimal getRentalFee(){return rentalFee;} public String getServiceItems(){return serviceItems;} public String getSameDayBenefits(){return sameDayBenefits;}
}
