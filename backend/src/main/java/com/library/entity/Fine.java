package com.library.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

@Entity
@Table(name = "fines")
public class Fine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Borrowing reference is required")
    @OneToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "borrowing_id", nullable = false, unique = true)
    @JsonIgnoreProperties({"fine"})
    private Borrowing borrowing;

    @NotNull(message = "Fine amount is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Fine amount cannot be negative")
    @Column(nullable = false)
    private Double amount;

    @NotNull(message = "Fine status is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FineStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public Fine() {
    }

    public Fine(Borrowing borrowing, Double amount, FineStatus status) {
        this.borrowing = borrowing;
        this.amount = amount;
        this.status = status;
    }

    public Fine(Long id, Borrowing borrowing, Double amount, FineStatus status, LocalDateTime createdAt) {
        this.id = id;
        this.borrowing = borrowing;
        this.amount = amount;
        this.status = status;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = FineStatus.UNPAID;
        }
        if (this.amount == null) {
            this.amount = 0.0;
        }
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Borrowing getBorrowing() {
        return borrowing;
    }

    public void setBorrowing(Borrowing borrowing) {
        this.borrowing = borrowing;
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
