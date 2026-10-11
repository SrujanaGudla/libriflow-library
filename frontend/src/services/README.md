# Frontend Services
This directory contains API client layers communicating with the Spring Boot backend:
- `api.js`: Axios instance with interceptors for JWT Bearer token attachment and 401 handling.
- `authService.js`: Authentication endpoints (login, register, getCurrentUser).
- `bookService.js`: Book CRUD operations and search APIs.
- `borrowService.js`: Borrow, return, and loan history APIs.
- `fineService.js`: Student fine calculation and payment APIs.
