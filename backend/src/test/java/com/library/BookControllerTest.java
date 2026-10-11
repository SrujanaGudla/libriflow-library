package com.library;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.library.dto.BookDto;
import com.library.dto.LoginRequest;
import com.library.dto.RegisterRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(locations = "classpath:application-test.properties")
public class BookControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String adminToken;
    private String studentToken;

    @BeforeEach
    public void setup() throws Exception {
        // Obtain Admin Token
        LoginRequest adminLogin = new LoginRequest("admin@library.com", "admin123");
        MvcResult adminResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode adminJson = objectMapper.readTree(adminResult.getResponse().getContentAsString());
        this.adminToken = adminJson.get("data").get("token").asText();

        // Register & Obtain Student Token
        String studentEmail = "student_" + System.currentTimeMillis() + "@test.com";
        RegisterRequest registerReq = new RegisterRequest("Test Student", studentEmail, "student123");
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)));

        LoginRequest studentLogin = new LoginRequest(studentEmail, "student123");
        MvcResult studentResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(studentLogin)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode studentJson = objectMapper.readTree(studentResult.getResponse().getContentAsString());
        this.studentToken = studentJson.get("data").get("token").asText();
    }

    @Test
    @DisplayName("Admin can add a new book and availableQuantity equals quantity (201 Created)")
    public void testAdminCanAddBook() throws Exception {
        String isbn = "ISBN-" + System.currentTimeMillis();
        BookDto book = new BookDto(null, "Clean Code", "Robert C. Martin", "Programming", isbn, 10, null, null);

        mockMvc.perform(post("/api/books")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(book)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.title", is("Clean Code")))
                .andExpect(jsonPath("$.data.quantity", is(10)))
                .andExpect(jsonPath("$.data.availableQuantity", is(10)));
    }

    @Test
    @DisplayName("Student receives 403 Forbidden when attempting to add a book")
    public void testStudentCannotAddBook() throws Exception {
        BookDto book = new BookDto(null, "Hacking 101", "Anonymous", "Security", "ISBN-FORBIDDEN-1", 5, null, null);

        mockMvc.perform(post("/api/books")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(book)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)));
    }

    @Test
    @DisplayName("Student receives 403 Forbidden when attempting to update a book")
    public void testStudentCannotUpdateBook() throws Exception {
        // Create book as admin
        String isbn = "ISBN-UPD-" + System.currentTimeMillis();
        BookDto book = new BookDto(null, "Spring in Action", "Craig Walls", "Java", isbn, 5, null, null);

        MvcResult result = mockMvc.perform(post("/api/books")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(book)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode jsonNode = objectMapper.readTree(result.getResponse().getContentAsString());
        long bookId = jsonNode.get("data").get("id").asLong();

        // Attempt update as student
        book.setTitle("Unauthorized Update");
        mockMvc.perform(put("/api/books/" + bookId)
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(book)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)));
    }

    @Test
    @DisplayName("Student receives 403 Forbidden when attempting to delete a book")
    public void testStudentCannotDeleteBook() throws Exception {
        // Create book as admin
        String isbn = "ISBN-DEL-" + System.currentTimeMillis();
        BookDto book = new BookDto(null, "Pragmatic Programmer", "Andy Hunt", "Software", isbn, 3, null, null);

        MvcResult result = mockMvc.perform(post("/api/books")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(book)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode jsonNode = objectMapper.readTree(result.getResponse().getContentAsString());
        long bookId = jsonNode.get("data").get("id").asLong();

        // Attempt delete as student
        mockMvc.perform(delete("/api/books/" + bookId)
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)));
    }

    @Test
    @DisplayName("Student and Admin can view all books and book details (200 OK)")
    public void testBothRolesCanViewBooks() throws Exception {
        // View as student
        mockMvc.perform(get("/api/books")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", notNullValue()));

        // View as admin
        mockMvc.perform(get("/api/books")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @DisplayName("Admin can update and delete a book successfully")
    public void testAdminUpdateAndDeleteBook() throws Exception {
        String isbn = "ISBN-FULL-" + System.currentTimeMillis();
        BookDto book = new BookDto(null, "Java Concurrency in Practice", "Brian Goetz", "Java", isbn, 8, null, null);

        // Add
        MvcResult addResult = mockMvc.perform(post("/api/books")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(book)))
                .andExpect(status().isCreated())
                .andReturn();

        long bookId = objectMapper.readTree(addResult.getResponse().getContentAsString()).get("data").get("id").asLong();

        // Update
        book.setTitle("Java Concurrency in Practice (2nd Ed)");
        book.setQuantity(12);
        mockMvc.perform(put("/api/books/" + bookId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(book)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title", is("Java Concurrency in Practice (2nd Ed)")))
                .andExpect(jsonPath("$.data.quantity", is(12)))
                .andExpect(jsonPath("$.data.availableQuantity", is(12)));

        // Delete
        mockMvc.perform(delete("/api/books/" + bookId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("deleted successfully")));

        // Verify gone
        mockMvc.perform(get("/api/books/" + bookId))
                .andExpect(status().isNotFound());
    }
}
