package com.marrymate.planning.domain;

import static org.junit.jupiter.api.Assertions.*;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class PlanningItemTest {
    @Test
    void packageQuoteIsBasePlusAdditionalCost() {
        PlanningItem item = new PlanningItem(1L, "스드메", "스드메 패키지");

        item.change("스드메", "스드메 패키지", "우리 스드메", "RESEARCHING", null,
            BigDecimal.ZERO, BigDecimal.ZERO, true, new BigDecimal("2500000"), new BigDecimal("700000"),
            "스튜디오 촬영|드레스|메이크업", "드레스 업그레이드", null, "GENERAL", "", "", "", "");

        assertEquals(new BigDecimal("3200000"), item.getQuotedAmount());
        assertTrue(item.isPackageContract());
        assertEquals("스튜디오 촬영|드레스|메이크업", item.getPackageIncludedItems());
    }

    @Test
    void individualQuoteDoesNotKeepOldPackageValues() {
        PlanningItem item = new PlanningItem(1L, "스드메", "스드메 패키지");
        item.change("스드메", "스드메 패키지", "업체", "RESEARCHING", null,
            BigDecimal.ZERO, BigDecimal.ZERO, true, new BigDecimal("2000000"), BigDecimal.ZERO,
            "드레스", "", null, "GENERAL", "", "", "", "");

        item.change("스드메", "메이크업", "별도 업체", "RESEARCHING", null,
            new BigDecimal("500000"), BigDecimal.ZERO, false, BigDecimal.ZERO, BigDecimal.ZERO,
            "", "", null, "GENERAL", "", "", "", "");

        assertEquals(new BigDecimal("500000"), item.getQuotedAmount());
        assertFalse(item.isPackageContract());
        assertEquals("", item.getPackageIncludedItems());
    }
}
