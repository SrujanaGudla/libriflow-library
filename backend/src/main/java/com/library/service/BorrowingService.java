package com.library.service;

import com.library.dto.BorrowingDto;

import java.util.List;

public interface BorrowingService {
    BorrowingDto borrowBook(Long bookId, String userEmail);
    BorrowingDto returnBook(Long borrowingId, String userEmail);
    List<BorrowingDto> getMyBorrowings(String userEmail);
    List<BorrowingDto> getAllBorrowings();
}
