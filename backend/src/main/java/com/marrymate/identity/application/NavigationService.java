package com.marrymate.identity.application;
import java.util.List;
import com.marrymate.identity.domain.UserNavigation;
import com.marrymate.identity.repository.UserNavigationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
@Service
public class NavigationService {
    public static final List<String> DEFAULT=List.of("dashboard","checklist","meals","compare","packages","calendar","budget");
    private final UserNavigationRepository preferences;
    public NavigationService(UserNavigationRepository preferences) { this.preferences=preferences; }
    @Transactional(readOnly=true) public List<String> get(Long userId) { return preferences.findById(userId).map(value->List.of(value.getVisibleMenus().split("\\|"))).orElse(DEFAULT); }
    @Transactional public List<String> save(Long userId,List<String> menus) {
        if(menus==null || !menus.contains("dashboard") || menus.size()>DEFAULT.size() || menus.stream().distinct().count()!=menus.size() || !DEFAULT.containsAll(menus)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"홈을 포함해 표시할 메뉴를 선택해 주세요.");
        preferences.save(new UserNavigation(userId,String.join("|",menus))); return menus;
    }
}
