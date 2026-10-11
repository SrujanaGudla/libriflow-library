package com.library.service;

import com.library.dto.FineDto;
import com.library.entity.Borrowing;
import com.library.entity.Fine;
import com.library.entity.FineStatus;
import com.library.entity.Role;
import com.library.entity.User;
import com.library.exception.BadRequestException;
import com.library.exception.ForbiddenException;
import com.library.exception.ResourceNotFoundException;
import com.library.repository.FineRepository;
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
public class FineServiceImpl implements FineService {

    @Autowired
    private FineRepository fineRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    @Transactional
    public FineDto calculateAndApplyFine(Borrowing borrowing, LocalDate returnDate) {
        if (borrowing == null || borrowing.getDueDate() == null || returnDate == null) {
            return null;
        }

        if (returnDate.isAfter(borrowing.getDueDate())) {
            long lateDays = ChronoUnit.DAYS.between(borrowing.getDueDate(), returnDate);
            if (lateDays > 0) {
                double totalFine = lateDays * FINE_PER_DAY;

                Fine fine = fineRepository.findByBorrowingId(borrowing.getId())
                        .orElse(new Fine());

                // Avoid modifying or recalculating an already paid fine
                if (fine.getStatus() == FineStatus.PAID) {
                    return FineDto.fromEntity(fine);
                }

                fine.setBorrowing(borrowing);
                fine.setAmount(totalFine);
                if (fine.getStatus() == null) {
                    fine.setStatus(FineStatus.UNPAID);
                }
                if (fine.getCreatedAt() == null) {
                    fine.setCreatedAt(LocalDateTime.now());
                }

                Fine savedFine = fineRepository.save(fine);
                borrowing.setFine(savedFine);
                return FineDto.fromEntity(savedFine);
            }
        }
        return null;
    }

    @Override
    @Transactional(readOnly = true)
    public List<FineDto> getMyFines(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        List<Fine> fines = fineRepository.findByUserId(user.getId());
        return fines.stream()
                .map(FineDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<FineDto> getAllFines() {
        List<Fine> fines = fineRepository.findAllByOrderByCreatedAtDesc();
        return fines.stream()
                .map(FineDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public FineDto payFine(Long fineId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        Fine fine = fineRepository.findById(fineId)
                .orElseThrow(() -> new ResourceNotFoundException("Fine", "id", fineId));

        // Authorization check: User must be ADMIN or the student who incurred the fine
        Long studentId = fine.getBorrowing().getUser().getId();
        if (user.getRole() != Role.ADMIN && !studentId.equals(user.getId())) {
            throw new ForbiddenException("Access Denied: You cannot pay another student's fine.");
        }

        // Prevent duplicate payment
        if (fine.getStatus() == FineStatus.PAID) {
            throw new BadRequestException("This fine of ₹" + fine.getAmount() + " has already been paid.");
        }

        fine.setStatus(FineStatus.PAID);
        Fine updatedFine = fineRepository.save(fine);
        return FineDto.fromEntity(updatedFine);
    }
}
