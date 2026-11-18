package com.marrymate.common.api;

import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ProblemDetail> rejectedRequest(ResponseStatusException exception) {
        var problem=ProblemDetail.forStatusAndDetail(exception.getStatusCode(),exception.getReason()==null?"요청을 처리하지 못했어요.":exception.getReason());
        return ResponseEntity.status(exception.getStatusCode()).body(problem);
    }
}
