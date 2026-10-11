package com.library.repository;

import com.library.entity.Fine;
import com.library.entity.FineStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FineRepository extends JpaRepository<Fine, Long> {
    Optional<Fine> findByBorrowingId(Long borrowingId);

    @Query("SELECT f FROM Fine f WHERE f.borrowing.user.id = :userId ORDER BY f.createdAt DESC")
    List<Fine> findByUserId(@Param("userId") Long userId);

    @Query("SELECT f FROM Fine f WHERE f.borrowing.user.id = :userId AND f.status = :status ORDER BY f.createdAt DESC")
    List<Fine> findByUserIdAndStatus(@Param("userId") Long userId, @Param("status") FineStatus status);

    List<Fine> findAllByOrderByCreatedAtDesc();

    List<Fine> findByStatus(FineStatus status);
}
