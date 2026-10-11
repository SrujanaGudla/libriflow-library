package com.library.service;

import com.library.dto.BookDto;

import java.util.List;

public interface BookService {
    List<BookDto> getAllBooks(String query, String category);
    BookDto getBookById(Long id);
    BookDto addBook(BookDto bookDto);
    BookDto updateBook(Long id, BookDto bookDto);
    void deleteBook(Long id);
}
