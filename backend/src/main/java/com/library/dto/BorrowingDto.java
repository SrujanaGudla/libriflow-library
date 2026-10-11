package com.library.dto;

import com.library.entity.BorrowStatus;
import com.library.entity.Borrowing;
import com.library.entity.FineStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class BorrowingDto {

    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;

    private Long bookId;
    private String bookTitle;
    private String bookAuthor;
    private String bookIsbn;

    private LocalDate borrowDate;
    private LocalDate dueDate;
    private LocalDate returnDate;
    private BorrowStatus status;

    private Double fineAmount;
    private FineStatus fineStatus;

    private LocalDateTime createdAt;

    public BorrowingDto() {
    }

    public BorrowingDto(Long id, Long userId, String userName, String userEmail,
                        Long bookId, String bookTitle, String bookAuthor, String bookIsbn,
                        LocalDate borrowDate, LocalDate dueDate, LocalDate returnDate,
                        BorrowStatus status, Double fineAmount, FineStatus fineStatus,
                        LocalDateTime createdAt) {
        this.id = id;
        this.userId = userId;
        this.userName = userName;
        this.userEmail = userEmail;
        this.bookId = bookId;
        this.bookTitle = bookTitle;
        this.bookAuthor = bookAuthor;
        this.bookIsbn = bookIsbn;
        this.borrowDate = borrowDate;
        this.dueDate = dueDate;
        this.returnDate = returnDate;
        this.status = status;
        this.fineAmount = fineAmount;
        this.fineStatus = fineStatus;
        this.createdAt = createdAt;
    }

    public static BorrowingDto fromEntity(Borrowing borrowing) {
        if (borrowing == null) return null;

        Double fineAmt = null;
        FineStatus fStatus = null;
        if (borrowing.getFine() != null) {
            fineAmt = borrowing.getFine().getAmount();
            fStatus = borrowing.getFine().getStatus();
        }

        return new BorrowingDto(
                borrowing.getId(),
                borrowing.getUser() != null ? borrowing.getUser().getId() : null,
                borrowing.getUser() != null ? borrowing.getUser().getName() : null,
                borrowing.getUser() != null ? borrowing.getUser().getEmail() : null,
                borrowing.getBook() != null ? borrowing.getBook().getId() : null,
                borrowing.getBook() != null ? borrowing.getBook().getTitle() : null,
                borrowing.getBook() != null ? borrowing.getBook().getAuthor() : null,
                borrowing.getBook() != null ? borrowing.getBook().getIsbn() : null,
                borrowing.getBorrowDate(),
                borrowing.getDueDate(),
                borrowing.getReturnDate(),
                borrowing.getStatus(),
                fineAmt,
                fStatus,
                borrowing.getCreatedAt()
        );
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
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

    public BorrowStatus getStatus() {
        return status;
    }

    public void setStatus(BorrowStatus status) {
        this.status = status;
    }

    public Double getFineAmount() {
        return fineAmount;
    }

    public void setFineAmount(Double fineAmount) {
        this.fineAmount = fineAmount;
    }

    public FineStatus getFineStatus() {
        return fineStatus;
    }

    public void setFineStatus(FineStatus fineStatus) {
        this.fineStatus = fineStatus;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
