package com.library.dto;

import com.library.entity.Book;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public class BookDto {

    private Long id;

    @NotBlank(message = "Title is required")
    @Size(min = 1, max = 255, message = "Title must be between 1 and 255 characters")
    private String title;

    @NotBlank(message = "Author is required")
    @Size(min = 1, max = 255, message = "Author must be between 1 and 255 characters")
    private String author;

    @NotBlank(message = "Category is required")
    @Size(min = 1, max = 100, message = "Category must be between 1 and 100 characters")
    private String category;

    @NotBlank(message = "ISBN is required")
    @Size(min = 5, max = 50, message = "ISBN must be between 5 and 50 characters")
    private String isbn;

    @NotNull(message = "Quantity is required")
    @Min(value = 0, message = "Quantity must be greater than or equal to 0")
    private Integer quantity;

    private Integer availableQuantity;
    private LocalDateTime createdAt;

    public BookDto() {
    }

    public BookDto(Long id, String title, String author, String category, String isbn, Integer quantity, Integer availableQuantity, LocalDateTime createdAt) {
        this.id = id;
        this.title = title;
        this.author = author;
        this.category = category;
        this.isbn = isbn;
        this.quantity = quantity;
        this.availableQuantity = availableQuantity;
        this.createdAt = createdAt;
    }

    public static BookDto fromEntity(Book book) {
        if (book == null) return null;
        return new BookDto(
                book.getId(),
                book.getTitle(),
                book.getAuthor(),
                book.getCategory(),
                book.getIsbn(),
                book.getQuantity(),
                book.getAvailableQuantity(),
                book.getCreatedAt()
        );
    }

    public Book toEntity() {
        Book book = new Book();
        book.setId(this.id);
        book.setTitle(this.title != null ? this.title.trim() : null);
        book.setAuthor(this.author != null ? this.author.trim() : null);
        book.setCategory(this.category != null ? this.category.trim() : null);
        book.setIsbn(this.isbn != null ? this.isbn.trim() : null);
        book.setQuantity(this.quantity);
        book.setAvailableQuantity(this.availableQuantity != null ? this.availableQuantity : this.quantity);
        return book;
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getAuthor() {
        return author;
    }

    public void setAuthor(String author) {
        this.author = author;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getIsbn() {
        return isbn;
    }

    public void setIsbn(String isbn) {
        this.isbn = isbn;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public Integer getAvailableQuantity() {
        return availableQuantity;
    }

    public void setAvailableQuantity(Integer availableQuantity) {
        this.availableQuantity = availableQuantity;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
