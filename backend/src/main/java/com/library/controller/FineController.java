package com.library.controller;

import com.library.dto.ApiResponse;
import com.library.dto.FineDto;
import com.library.service.FineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fines")
public class FineController {

    @Autowired
    private FineService fineService;

    @GetMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<FineDto>>> getMyFines(Authentication authentication) {
        String userEmail = authentication.getName();
        List<FineDto> fines = fineService.getMyFines(userEmail);
        return ResponseEntity.ok(ApiResponse.success("Your fine records retrieved", fines));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<FineDto>>> getAllFines() {
        List<FineDto> fines = fineService.getAllFines();
        return ResponseEntity.ok(ApiResponse.success("All fine records retrieved", fines));
    }

    @PutMapping("/{id}/pay")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    public ResponseEntity<ApiResponse<FineDto>> payFine(
            @PathVariable Long id,
            Authentication authentication) {
        String userEmail = authentication.getName();
        FineDto paidFine = fineService.payFine(id, userEmail);
        return ResponseEntity.ok(ApiResponse.success("Fine of ₹" + paidFine.getAmount() + " paid successfully", paidFine));
    }
}
