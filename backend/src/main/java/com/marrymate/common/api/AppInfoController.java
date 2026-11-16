package com.marrymate.common.api;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class AppInfoController {

    @GetMapping
    Map<String, String> appInfo() {
        return Map.of(
                "product", "Marry Mate",
                "version", "v2",
                "status", "building"
        );
    }
}

