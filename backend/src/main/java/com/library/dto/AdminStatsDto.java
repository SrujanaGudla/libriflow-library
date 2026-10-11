package com.library.dto;

import java.util.List;
import java.util.Map;

public class AdminStatsDto {

    private long totalBooks;
    private long totalCopies;
    private long availableCopies;
    private long borrowedCopies;
    private long totalBorrowings;
    private long activeLoans;
    private long overdueLoans;
    private long returnedLoans;
    private long totalStudents;
    private long totalFinesCount;
    private long unpaidFinesCount;
    private double unpaidFinesAmount;
    private double paidFinesAmount;

    private Map<String, Long> categoryDistribution;
    private List<PopularBookDto> popularBooks;

    public AdminStatsDto() {
    }

    public static class PopularBookDto {
        private String title;
        private String author;
        private long borrowCount;

        public PopularBookDto() {}

        public PopularBookDto(String title, String author, long borrowCount) {
            this.title = title;
            this.author = author;
            this.borrowCount = borrowCount;
        }

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getAuthor() { return author; }
        public void setAuthor(String author) { this.author = author; }
        public long getBorrowCount() { return borrowCount; }
        public void setBorrowCount(long borrowCount) { this.borrowCount = borrowCount; }
    }

    // Getters and Setters
    public long getTotalBooks() { return totalBooks; }
    public void setTotalBooks(long totalBooks) { this.totalBooks = totalBooks; }

    public long getTotalCopies() { return totalCopies; }
    public void setTotalCopies(long totalCopies) { this.totalCopies = totalCopies; }

    public long getAvailableCopies() { return availableCopies; }
    public void setAvailableCopies(long availableCopies) { this.availableCopies = availableCopies; }

    public long getBorrowedCopies() { return borrowedCopies; }
    public void setBorrowedCopies(long borrowedCopies) { this.borrowedCopies = borrowedCopies; }

    public long getTotalBorrowings() { return totalBorrowings; }
    public void setTotalBorrowings(long totalBorrowings) { this.totalBorrowings = totalBorrowings; }

    public long getActiveLoans() { return activeLoans; }
    public void setActiveLoans(long activeLoans) { this.activeLoans = activeLoans; }

    public long getOverdueLoans() { return overdueLoans; }
    public void setOverdueLoans(long overdueLoans) { this.overdueLoans = overdueLoans; }

    public long getReturnedLoans() { return returnedLoans; }
    public void setReturnedLoans(long returnedLoans) { this.returnedLoans = returnedLoans; }

    public long getTotalStudents() { return totalStudents; }
    public void setTotalStudents(long totalStudents) { this.totalStudents = totalStudents; }

    public long getTotalFinesCount() { return totalFinesCount; }
    public void setTotalFinesCount(long totalFinesCount) { this.totalFinesCount = totalFinesCount; }

    public long getUnpaidFinesCount() { return unpaidFinesCount; }
    public void setUnpaidFinesCount(long unpaidFinesCount) { this.unpaidFinesCount = unpaidFinesCount; }

    public double getUnpaidFinesAmount() { return unpaidFinesAmount; }
    public void setUnpaidFinesAmount(double unpaidFinesAmount) { this.unpaidFinesAmount = unpaidFinesAmount; }

    public double getPaidFinesAmount() { return paidFinesAmount; }
    public void setPaidFinesAmount(double paidFinesAmount) { this.paidFinesAmount = paidFinesAmount; }

    public Map<String, Long> getCategoryDistribution() { return categoryDistribution; }
    public void setCategoryDistribution(Map<String, Long> categoryDistribution) { this.categoryDistribution = categoryDistribution; }

    public List<PopularBookDto> getPopularBooks() { return popularBooks; }
    public void setPopularBooks(List<PopularBookDto> popularBooks) { this.popularBooks = popularBooks; }
}
