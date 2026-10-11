package com.library.dto;

import com.library.entity.Fine;
import com.library.entity.FineStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

public class FineDto {

    private Long id;
    private Long borrowingId;

    private Long userId;
    private String studentName;
    private String studentEmail;

    private Long bookId;
    private String bookTitle;
    private String bookAuthor;
    private String bookIsbn;

    private LocalDate borrowDate;
    private LocalDate dueDate;
    private LocalDate returnDate;
    private long lateDays;

    private Double amount;
    private FineStatus status;
    private LocalDateTime createdAt;

    public FineDto() {
    }

    public FineDto(Long id, Long borrowingId, Long userId, String studentName, String studentEmail,
                   Long bookId, String bookTitle, String bookAuthor, String bookIsbn,
                   LocalDate borrowDate, LocalDate dueDate, LocalDate returnDate,
                   long lateDays, Double amount, FineStatus status, LocalDateTime createdAt) {
        this.id = id;
        this.borrowingId = borrowingId;
        this.userId = userId;
        this.studentName = studentName;
        this.studentEmail = studentEmail;
        this.bookId = bookId;
        this.bookTitle = bookTitle;
        this.bookAuthor = bookAuthor;
        this.bookIsbn = bookIsbn;
        this.borrowDate = borrowDate;
        this.dueDate = dueDate;
        this.returnDate = returnDate;
        this.lateDays = lateDays;
        this.amount = amount;
        this.status = status;
        this.createdAt = createdAt;
    }

    public static FineDto fromEntity(Fine fine) {
        if (fine == null) return null;

        var borrowing = fine.getBorrowing();
        var user = borrowing != null ? borrowing.getUser() : null;
        var book = borrowing != null ? borrowing.getBook() : null;

        LocalDate borrowDate = borrowing != null ? borrowing.getBorrowDate() : null;
        LocalDate dueDate = borrowing != null ? borrowing.getDueDate() : null;
        LocalDate returnDate = borrowing != null ? borrowing.getReturnDate() : null;

        long lateDays = 0;
        if (dueDate != null) {
            LocalDate effectiveReturn = (returnDate != null) ? returnDate : LocalDate.now();
            if (effectiveReturn.isAfter(dueDate)) {
                lateDays = ChronoUnit.DAYS.between(dueDate, effectiveReturn);
            }
        }

        return new FineDto(
                fine.getId(),
                borrowing != null ? borrowing.getId() : null,
                user != null ? user.getId() : null,
                user != null ? user.getName() : null,
                user != null ? user.getEmail() : null,
                book != null ? book.getId() : null,
                book != null ? book.getTitle() : null,
                book != null ? book.getAuthor() : null,
                book != null ? book.getIsbn() : null,
                borrowDate,
                dueDate,
                returnDate,
                lateDays,
                fine.getAmount(),
                fine.getStatus(),
                fine.getCreatedAt()
        );
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getBorrowingId() {
        return borrowingId;
    }

    public void setBorrowingId(Long borrowingId) {
        this.borrowingId = borrowingId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public String getStudentEmail() {
        return studentEmail;
    }

    public void setStudentEmail(String studentEmail) {
        this.studentEmail = studentEmail;
    }

    public Long getBookId() {
        return bookId;
    }

    public void setBookId(Long bookId) {
        this.bookId = bookId;
    }

    public String getBookTitle() {
        return bookTitle;
    }

    public void setBookTitle(String bookTitle) {
        this.bookTitle = bookTitle;
    }

    public String getBookAuthor() {
        return bookAuthor;
    }

    public void setBookAuthor(String bookAuthor) {
        this.bookAuthor = bookAuthor;
    }

    public String getBookIsbn() {
        return bookIsbn;
    }

    public void setBookIsbn(String bookIsbn) {
        this.bookIsbn = bookIsbn;
    }

    public LocalDate getBorrowDate() {
        return borrowDate;
    }

    public void setBorrowDate(LocalDate borrowDate) {
        this.borrowDate = borrowDate;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public LocalDate getReturnDate() {
        return returnDate;
    }

    public void setReturnDate(LocalDate returnDate) {
        this.returnDate = returnDate;
    }

    public long getLateDays() {
        return lateDays;
    }

    public void setLateDays(long lateDays) {
        this.lateDays = lateDays;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public FineStatus getStatus() {
        return status;
    }

    public void setStatus(FineStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
