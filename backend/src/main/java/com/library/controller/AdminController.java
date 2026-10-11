package com.library.controller;

import com.library.dto.AdminStatsDto;
import com.library.dto.ApiResponse;
import com.library.dto.UserDto;
import com.library.entity.*;
import com.library.repository.BookRepository;
import com.library.repository.BorrowingRepository;
import com.library.repository.FineRepository;
import com.library.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private BorrowingRepository borrowingRepository;

    @Autowired
    private FineRepository fineRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<AdminStatsDto>> getSystemStats() {
        AdminStatsDto stats = new AdminStatsDto();

        List<Book> allBooks = bookRepository.findAll();
        List<Borrowing> allBorrowings = borrowingRepository.findAll();
        List<Fine> allFines = fineRepository.findAll();
        List<User> students = userRepository.findByRole(Role.STUDENT);

        long totalBooks = allBooks.size();
        long totalCopies = allBooks.stream().mapToLong(b -> b.getQuantity() != null ? b.getQuantity() : 0).sum();
        long availableCopies = allBooks.stream().mapToLong(b -> b.getAvailableQuantity() != null ? b.getAvailableQuantity() : 0).sum();
        long borrowedCopies = Math.max(0, totalCopies - availableCopies);

        LocalDate today = LocalDate.now();
        long activeLoans = allBorrowings.stream()
                .filter(b -> b.getStatus() == BorrowStatus.BORROWED)
                .count();

        long overdueLoans = allBorrowings.stream()
                .filter(b -> b.getStatus() == BorrowStatus.BORROWED && b.getDueDate() != null && b.getDueDate().isBefore(today))
                .count();

        long returnedLoans = allBorrowings.stream()
                .filter(b -> b.getStatus() == BorrowStatus.RETURNED)
                .count();

        long unpaidFinesCount = allFines.stream()
                .filter(f -> f.getStatus() == FineStatus.UNPAID)
                .count();

        double unpaidFinesAmount = allFines.stream()
                .filter(f -> f.getStatus() == FineStatus.UNPAID && f.getAmount() != null)
                .mapToDouble(Fine::getAmount)
                .sum();

        double paidFinesAmount = allFines.stream()
                .filter(f -> f.getStatus() == FineStatus.PAID && f.getAmount() != null)
                .mapToDouble(Fine::getAmount)
                .sum();

        stats.setTotalBooks(totalBooks);
        stats.setTotalCopies(totalCopies);
        stats.setAvailableCopies(availableCopies);
        stats.setBorrowedCopies(borrowedCopies);
        stats.setTotalBorrowings(allBorrowings.size());
        stats.setActiveLoans(activeLoans);
        stats.setOverdueLoans(overdueLoans);
        stats.setReturnedLoans(returnedLoans);
        stats.setTotalStudents(students.size());
        stats.setTotalFinesCount(allFines.size());
        stats.setUnpaidFinesCount(unpaidFinesCount);
        stats.setUnpaidFinesAmount(unpaidFinesAmount);
        stats.setPaidFinesAmount(paidFinesAmount);

        // Category distribution
        Map<String, Long> categoryDistribution = allBooks.stream()
                .filter(b -> b.getCategory() != null && !b.getCategory().trim().isEmpty())
                .collect(Collectors.groupingBy(Book::getCategory, Collectors.counting()));
        stats.setCategoryDistribution(categoryDistribution);

        // Popular books
        Map<Long, Long> bookBorrowCounts = allBorrowings.stream()
                .filter(b -> b.getBook() != null)
                .collect(Collectors.groupingBy(b -> b.getBook().getId(), Collectors.counting()));

        Map<Long, Book> bookMap = allBooks.stream().collect(Collectors.toMap(Book::getId, b -> b, (b1, b2) -> b1));

        List<AdminStatsDto.PopularBookDto> popular = bookBorrowCounts.entrySet().stream()
                .sorted(Map.Entry.<Long, Long>comparingByValue().reversed())
                .limit(5)
                .map(entry -> {
                    Book b = bookMap.get(entry.getKey());
                    return new AdminStatsDto.PopularBookDto(
                            b != null ? b.getTitle() : "Unknown Title",
                            b != null ? b.getAuthor() : "Unknown Author",
                            entry.getValue()
                    );
                })
                .collect(Collectors.toList());
        stats.setPopularBooks(popular);

        return ResponseEntity.ok(ApiResponse.success("System statistics retrieved", stats));
    }

    @GetMapping("/students")
    public ResponseEntity<ApiResponse<List<UserDto>>> getAllStudents() {
        List<User> students = userRepository.findByRole(Role.STUDENT);
        List<UserDto> studentDtos = students.stream()
                .map(UserDto::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Students retrieved successfully", studentDtos));
    }
}
