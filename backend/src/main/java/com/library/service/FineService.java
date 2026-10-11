package com.library.service;

import com.library.dto.FineDto;
import com.library.entity.Borrowing;

import java.time.LocalDate;
import java.util.List;

public interface FineService {
    double FINE_PER_DAY = 10.0;

    FineDto calculateAndApplyFine(Borrowing borrowing, LocalDate returnDate);
    List<FineDto> getMyFines(String userEmail);
    List<FineDto> getAllFines();
    FineDto payFine(Long fineId, String userEmail);
}
