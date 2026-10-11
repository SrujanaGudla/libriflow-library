package com.library.service;

import com.library.dto.BookDto;
import com.library.entity.Book;
import com.library.entity.BorrowStatus;
import com.library.entity.Borrowing;
import com.library.exception.BadRequestException;
import com.library.exception.ResourceNotFoundException;
import com.library.repository.BookRepository;
import com.library.repository.BorrowingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class BookServiceImpl implements BookService {

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private BorrowingRepository borrowingRepository;

    @Override
    @Transactional(readOnly = true)
    public List<BookDto> getAllBooks(String query, String category) {
        List<Book> books;
        boolean hasQuery = query != null && !query.trim().isEmpty();
        boolean hasCategory = category != null && !category.trim().isEmpty() && !category.trim().equalsIgnoreCase("All");

        if (hasQuery && hasCategory) {
            books = bookRepository.searchBooksWithCategory(query.trim(), category.trim());
        } else if (hasQuery) {
            books = bookRepository.searchBooks(query.trim());
        } else if (hasCategory) {
            books = bookRepository.findByCategoryIgnoreCase(category.trim());
        } else {
            books = bookRepository.findAll();
        }

        return books.stream()
                .map(BookDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public BookDto getBookById(Long id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book", "id", id));
        return BookDto.fromEntity(book);
    }

    @Override
    @Transactional
    public BookDto addBook(BookDto bookDto) {
        String cleanIsbn = bookDto.getIsbn().trim();

        if (bookRepository.existsByIsbn(cleanIsbn)) {
            throw new BadRequestException("A book with ISBN '" + cleanIsbn + "' already exists.");
        }

        Book book = new Book();
        book.setTitle(bookDto.getTitle().trim());
        book.setAuthor(bookDto.getAuthor().trim());
        book.setCategory(bookDto.getCategory().trim());
        book.setIsbn(cleanIsbn);
        book.setQuantity(bookDto.getQuantity());
        // Available quantity initialized to total quantity when creating a new book
        book.setAvailableQuantity(bookDto.getQuantity());

        Book savedBook = bookRepository.save(book);
        return BookDto.fromEntity(savedBook);
    }

    @Override
    @Transactional
    public BookDto updateBook(Long id, BookDto bookDto) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book", "id", id));

        String cleanIsbn = bookDto.getIsbn().trim();
        if (bookRepository.existsByIsbnAndIdNot(cleanIsbn, id)) {
            throw new BadRequestException("A book with ISBN '" + cleanIsbn + "' already exists.");
        }

        int currentlyBorrowed = book.getQuantity() - book.getAvailableQuantity();
        if (bookDto.getQuantity() < currentlyBorrowed) {
            throw new BadRequestException(
                    "Cannot reduce total quantity to " + bookDto.getQuantity() +
                    " because " + currentlyBorrowed + " copies are currently borrowed."
            );
        }

        int newAvailableQuantity = bookDto.getQuantity() - currentlyBorrowed;

        book.setTitle(bookDto.getTitle().trim());
        book.setAuthor(bookDto.getAuthor().trim());
        book.setCategory(bookDto.getCategory().trim());
        book.setIsbn(cleanIsbn);
        book.setQuantity(bookDto.getQuantity());
        book.setAvailableQuantity(newAvailableQuantity);

        Book updatedBook = bookRepository.save(book);
        return BookDto.fromEntity(updatedBook);
    }

    @Override
    @Transactional
    public void deleteBook(Long id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book", "id", id));

        List<Borrowing> borrowings = borrowingRepository.findByBookId(id);
        boolean hasActiveLoans = borrowings.stream()
                .anyMatch(b -> b.getStatus() == BorrowStatus.BORROWED || b.getStatus() == BorrowStatus.OVERDUE);

        if (hasActiveLoans) {
            throw new BadRequestException(
                    "Cannot delete book '" + book.getTitle() + "' because there are active student borrowings."
            );
        }

        if (!borrowings.isEmpty()) {
            throw new BadRequestException(
                    "Cannot delete book '" + book.getTitle() + "' because historical borrowing records exist for it. You can set its total quantity to 0 instead to archive it."
            );
        }

        bookRepository.delete(book);
    }
}
