package com.library.repository;

import com.library.entity.BorrowStatus;
import com.library.entity.Borrowing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BorrowingRepository extends JpaRepository<Borrowing, Long> {
    List<Borrowing> findByUserId(Long userId);
    List<Borrowing> findByUserIdOrderByBorrowDateDesc(Long userId);
    List<Borrowing> findAllByOrderByBorrowDateDesc();
    List<Borrowing> findByUserIdAndStatus(Long userId, BorrowStatus status);
    List<Borrowing> findByUserIdAndBookIdAndStatus(Long userId, Long bookId, BorrowStatus status);
    List<Borrowing> findByStatus(BorrowStatus status);
    List<Borrowing> findByBookId(Long bookId);
}
