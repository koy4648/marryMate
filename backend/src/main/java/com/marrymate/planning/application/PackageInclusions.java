package com.marrymate.planning.application;

import java.util.*;

/** A package inclusion is a preparation item, never a second contract. */
final class PackageInclusions {
    record Part(String label, String group, String name) {}
    private static final Map<String,List<Part>> PARTS = Map.ofEntries(
        entry("스튜디오 촬영", "스튜디오 촬영", "촬영 작가", "스튜디오 대여"),
        entry("스튜디오 드레스", "스튜디오 촬영", "드레스"),
        entry("스튜디오 헤어·메이크업", "스튜디오 촬영", "헤어", "메이크업"),
        entry("촬영 헬퍼", "스튜디오 촬영", "헬퍼"), entry("헤어변형", "스튜디오 촬영", "헤어변형"),
        entry("원본·수정본", "스튜디오 촬영", "원본·수정본"), entry("촬영 예복", "스튜디오 촬영", "예복"),
        entry("본식 드레스", "본식", "드레스"), entry("본식 헤어·메이크업", "본식", "헤어·메이크업"),
        entry("본식 헬퍼", "본식", "헬퍼"), entry("본식 예복", "본식", "예복"),
        entry("혼주 한복", "본식", "혼주 한복"), entry("혼주 헤어·메이크업", "본식", "혼주 헤어·메이크업"),
        entry("부케", "본식", "부케"), entry("본식 스냅·원판", "본식 촬영", "본식 스냅·원판"),
        entry("DVD", "본식 촬영", "DVD"), entry("아이폰 스냅", "본식 촬영", "아이폰 스냅"),
        entry("플래너", "플래너", "웨딩 플래너")
    );
    private static Map.Entry<String,List<Part>> entry(String label, String group, String... names) {
        return Map.entry(label, Arrays.stream(names).map(name->new Part(label,group,name)).toList());
    }
    static String labelFor(String group,String name) {
        return PARTS.values().stream().flatMap(List::stream).filter(part->part.group().equals(group)&&part.name().equals(name)).map(Part::label).findFirst().orElse(null);
    }
    static List<Part> parts(String included) {
        Map<String,Part> unique=new LinkedHashMap<>();
        for(String raw:(included==null?"":included).split("\\|")) {
            String label=switch(raw.trim()) { case "드레스" -> "스튜디오 드레스"; case "메이크업", "헤어·메이크업" -> "스튜디오 헤어·메이크업"; default -> raw.trim(); };
            if(label.isBlank()) continue;
            if(label.length()>120) throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST,"포함 항목 이름은 120자 이내로 입력해 주세요.");
            for(Part part:PARTS.getOrDefault(label,List.of(new Part(label,"기타",label)))) unique.put(part.group()+"|"+part.name(),part);
        }
        return List.copyOf(unique.values());
    }
}
