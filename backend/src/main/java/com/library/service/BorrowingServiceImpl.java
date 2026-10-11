package com.library.service;

import com.library.dto.BorrowingDto;
import com.library.entity.*;
import com.library.exception.BadRequestException;
import com.library.exception.ForbiddenException;
import com.library.exception.ResourceNotFoundException;
import com.library.repository.BookRepository;
import com.library.repository.BorrowingRepository;
import com.library.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BorrowingServiceImpl implements BorrowingService {

    @Autowired
    private BorrowingRepository borrowingRepository;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FineService fineService;

    @Override
    @Transactional
    public BorrowingDto borrowBook(Long bookId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        Book book = bookRepository.findByIdForUpdate(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Book", "id", bookId));

        if (book.getAvailableQuantity() <= 0) {
            throw new BadRequestException("Book '" + book.getTitle() + "' is currently out of stock.");
        }

        // Check if student already holds an active loan for this book
        List<Borrowing> existingLoans = borrowingRepository.findByUserIdAndBookIdAndStatus(
                user.getId(), bookId, BorrowStatus.BORROWED
        );
        if (!existingLoans.isEmpty()) {
            throw new BadRequestException("You have already borrowed a copy of '" + book.getTitle() + "' that has not yet been returned.");
        }

        // Decrement available quantity
        book.setAvailableQuantity(book.getAvailableQuantity() - 1);
        bookRepository.save(book);

        // Create borrowing record
        LocalDate borrowDate = LocalDate.now();
        LocalDate dueDate = borrowDate.plusDays(14); // 14 days default borrowing period

        Borrowing borrowing = new Borrowing();
        borrowing.setUser(user);
        borrowing.setBook(book);
        borrowing.setBorrowDate(borrowDate);
        borrowing.setDueDate(dueDate);
        borrowing.setStatus(BorrowStatus.BORROWED);
        borrowing.setCreatedAt(LocalDateTime.now());

        Borrowing savedBorrowing = borrowingRepository.save(borrowing);
        return BorrowingDto.fromEntity(savedBorrowing);
    }

    @Override
    @Transactional
    public BorrowingDto returnBook(Long borrowingId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        Borrowing borrowing = borrowingRepository.findById(borrowingId)
                .orElseThrow(() -> new ResourceNotFoundException("Borrowing", "id", borrowingId));

        // Ensure students can only return their own borrowings, while admins can manage all
        if (user.getRole() != Role.ADMIN && !borrowing.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException("Access Denied: You cannot modify another student's borrowing record.");
        }

        // Prevent duplicate returns
        if (borrowing.getStatus() == BorrowStatus.RETURNED) {
            throw new BadRequestException("This book has already been returned on " + borrowing.getReturnDate() + ".");
        }

        LocalDate returnDate = LocalDate.now();
        borrowing.setReturnDate(returnDate);
        borrowing.setStatus(BorrowStatus.RETURNED);

        // Increment book available quantity
        Book book = borrowing.getBook();
        book.setAvailableQuantity(Math.min(book.getQuantity(), book.getAvailableQuantity() + 1));
        bookRepository.save(book);

        // Calculate and attach fine if return date is overdue (using FINE_PER_DAY = 10)
        fineService.calculateAndApplyFine(borrowing, returnDate);

        Borrowing updatedBorrowing = borrowingRepository.save(borrowing);
        return BorrowingDto.fromEntity(updatedBorrowing);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BorrowingDto> getMyBorrowings(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        List<Borrowing> borrowings = borrowingRepository.findByUserIdOrderByBorrowDateDesc(user.getId());
        return borrowings.stream()
                .map(BorrowingDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<BorrowingDto> getAllBorrowings() {
        List<Borrowing> borrowings = borrowingRepository.findAllByOrderByBorrowDateDesc();
        return borrowings.stream()
                .map(BorrowingDto::fromEntity)
                .collect(Collectors.toList());
    }
}
