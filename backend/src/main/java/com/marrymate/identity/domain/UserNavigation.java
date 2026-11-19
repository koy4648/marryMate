package com.marrymate.identity.domain;
import jakarta.persistence.*;
@Entity @Table(name="user_navigation_preferences")
public class UserNavigation {
    @Id @Column(name="user_id") private Long userId;
    @Column(name="visible_menus",nullable=false,length=160) private String visibleMenus;
    protected UserNavigation() {}
    public UserNavigation(Long userId,String visibleMenus) { this.userId=userId; this.visibleMenus=visibleMenus; }
    public String getVisibleMenus() { return visibleMenus; }
}
