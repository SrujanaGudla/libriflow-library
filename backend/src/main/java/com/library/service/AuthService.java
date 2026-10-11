package com.library.service;

import com.library.dto.AuthResponse;
import com.library.dto.LoginRequest;
import com.library.dto.RegisterRequest;
import com.library.dto.UserDto;

public interface AuthService {
    UserDto registerStudent(RegisterRequest registerRequest);
    AuthResponse login(LoginRequest loginRequest);
    UserDto getCurrentUser(String email);
}
