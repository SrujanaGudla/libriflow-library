package com.library.controller;

import com.library.dto.ApiResponse;
import com.library.dto.BorrowingDto;
import com.library.service.BorrowingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/borrowings")
public class BorrowingController {

    @Autowired
    private BorrowingService borrowingService;

    @PostMapping("/{bookId}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<BorrowingDto>> borrowBook(
            @PathVariable Long bookId,
            Authentication authentication) {
        String userEmail = authentication.getName();
        BorrowingDto borrowing = borrowingService.borrowBook(bookId, userEmail);
        return new ResponseEntity<>(
                ApiResponse.success("Book borrowed successfully. Please return within 14 days.", borrowing),
                HttpStatus.CREATED
        );
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<BorrowingDto>>> getMyBorrowings(Authentication authentication) {
        String userEmail = authentication.getName();
        List<BorrowingDto> borrowings = borrowingService.getMyBorrowings(userEmail);
        return ResponseEntity.ok(ApiResponse.success("Your borrowing records retrieved", borrowings));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<BorrowingDto>>> getAllBorrowings() {
        List<BorrowingDto> borrowings = borrowingService.getAllBorrowings();
        return ResponseEntity.ok(ApiResponse.success("All system borrowing records retrieved", borrowings));
    }

    @PutMapping("/{id}/return")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    public ResponseEntity<ApiResponse<BorrowingDto>> returnBook(
            @PathVariable Long id,
            Authentication authentication) {
        String userEmail = authentication.getName();
        BorrowingDto returned = borrowingService.returnBook(id, userEmail);
        return ResponseEntity.ok(ApiResponse.success("Book returned successfully", returned));
    }
}
