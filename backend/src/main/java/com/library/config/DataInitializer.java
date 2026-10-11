package com.library.config;

import com.library.entity.Role;
import com.library.entity.User;
import com.library.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${app.default-admin.email:admin@library.com}")
    private String defaultAdminEmail;

    @Value("${app.default-admin.password:admin123}")
    private String defaultAdminPassword;

    @Value("${app.default-admin.name:Library Administrator}")
    private String defaultAdminName;

    @Override
    public void run(String... args) {
        initializeAdminUser();
    }

    private void initializeAdminUser() {
        List<User> admins = userRepository.findByRole(Role.ADMIN);
        if (admins.isEmpty()) {
            if (!userRepository.existsByEmail(defaultAdminEmail)) {
                User admin = new User();
                admin.setName(defaultAdminName);
                admin.setEmail(defaultAdminEmail);
                admin.setPassword(passwordEncoder.encode(defaultAdminPassword));
                admin.setRole(Role.ADMIN);
                admin.setCreatedAt(LocalDateTime.now());

                userRepository.save(admin);
                logger.info("=================================================================");
                logger.info(">>> Initial ADMIN account seeded successfully!");
                logger.info(">>> Email: {}", defaultAdminEmail);
                logger.info(">>> Default Password: {}", defaultAdminPassword);
                logger.info(">>> (Please change this password in production environment)");
                logger.info("=================================================================");
            }
        } else {
            logger.info(">>> System already has {} ADMIN user(s). No default admin created.", admins.size());
        }
    }
}
