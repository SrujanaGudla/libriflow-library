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

import java.time.LocalDate;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(locations = "classpath:application-test.properties")
public class BorrowingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String adminToken;
    private String student1Token;
    private String student2Token;

    @BeforeEach
    public void setup() throws Exception {
        // Admin Token
        LoginRequest adminLogin = new LoginRequest("admin@library.com", "admin123");
        MvcResult adminResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn();
        this.adminToken = objectMapper.readTree(adminResult.getResponse().getContentAsString())
                .get("data").get("token").asText();

        // Student 1
        String s1Email = "student1_" + System.currentTimeMillis() + "@test.com";
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new RegisterRequest("Student One", s1Email, "password123"))));
        MvcResult s1Result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(s1Email, "password123"))))
                .andExpect(status().isOk())
                .andReturn();
        this.student1Token = objectMapper.readTree(s1Result.getResponse().getContentAsString())
                .get("data").get("token").asText();

        // Student 2
        String s2Email = "student2_" + System.currentTimeMillis() + "@test.com";
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new RegisterRequest("Student Two", s2Email, "password123"))));
        MvcResult s2Result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(s2Email, "password123"))))
                .andExpect(status().isOk())
                .andReturn();
        this.student2Token = objectMapper.readTree(s2Result.getResponse().getContentAsString())
                .get("data").get("token").asText();
    }

    private long createBook(String title, int quantity) throws Exception {
        String isbn = "ISBN-" + System.nanoTime();
        BookDto book = new BookDto(null, title, "Author", "Tech", isbn, quantity, null, null);
        MvcResult res = mockMvc.perform(post("/api/books")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(book)))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(res.getResponse().getContentAsString()).get("data").get("id").asLong();
    }

    @Test
    @DisplayName("Student can borrow available book, stock decreases by 1, 14-day due date assigned")
    public void testStudentCanBorrowAvailableBook() throws Exception {
        long bookId = createBook("Design Patterns", 2);

        // Borrow book
        MvcResult result = mockMvc.perform(post("/api/borrowings/" + bookId)
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("BORROWED")))
                .andExpect(jsonPath("$.data.borrowDate", is(LocalDate.now().toString())))
                .andExpect(jsonPath("$.data.dueDate", is(LocalDate.now().plusDays(14).toString())))
                .andReturn();

        // Verify book stock decreased to 1
        mockMvc.perform(get("/api/books/" + bookId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.availableQuantity", is(1)));
    }

    @Test
    @DisplayName("Student cannot borrow a book when availableQuantity is 0 (400 Bad Request)")
    public void testStudentCannotBorrowOutOfStockBook() throws Exception {
        long bookId = createBook("Rare Manuscript", 0);

        mockMvc.perform(post("/api/borrowings/" + bookId)
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.message", containsString("out of stock")));
    }

    @Test
    @DisplayName("Student can view their own borrowings, but cannot access admin all-borrowings API")
    public void testStudentAccessIsolation() throws Exception {
        long bookId = createBook("Refactoring", 3);
        mockMvc.perform(post("/api/borrowings/" + bookId)
                .header("Authorization", "Bearer " + student1Token));

        // Student views own loans (200 OK)
        mockMvc.perform(get("/api/borrowings/my")
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))));

        // Student attempts to view all borrowings (403 Forbidden)
        mockMvc.perform(get("/api/borrowings")
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)));

        // Admin views all borrowings (200 OK)
        mockMvc.perform(get("/api/borrowings")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", notNullValue()));
    }

    @Test
    @DisplayName("Returning a book increments availableQuantity, records returnDate, and prevents duplicate return")
    public void testReturnBookFlow() throws Exception {
        long bookId = createBook("Clean Architecture", 1);

        // Student 1 borrows the only copy -> stock = 0
        MvcResult borrowRes = mockMvc.perform(post("/api/borrowings/" + bookId)
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isCreated())
                .andReturn();
        long borrowingId = objectMapper.readTree(borrowRes.getResponse().getContentAsString()).get("data").get("id").asLong();

        // Verify stock is 0
        mockMvc.perform(get("/api/books/" + bookId))
                .andExpect(jsonPath("$.data.availableQuantity", is(0)));

        // Student 1 returns the book
        mockMvc.perform(put("/api/borrowings/" + borrowingId + "/return")
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("RETURNED")))
                .andExpect(jsonPath("$.data.returnDate", is(LocalDate.now().toString())));

        // Verify stock is back to 1
        mockMvc.perform(get("/api/books/" + bookId))
                .andExpect(jsonPath("$.data.availableQuantity", is(1)));

        // Duplicate return attempt -> 400 Bad Request
        mockMvc.perform(put("/api/borrowings/" + borrowingId + "/return")
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("already been returned")));
    }

    @Test
    @DisplayName("Student cannot return another student's borrowing (403 Forbidden)")
    public void testStudentCannotModifyAnotherStudentsBorrowing() throws Exception {
        long bookId = createBook("Effective Java", 2);

        // Student 1 borrows
        MvcResult borrowRes = mockMvc.perform(post("/api/borrowings/" + bookId)
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isCreated())
                .andReturn();
        long borrowingId = objectMapper.readTree(borrowRes.getResponse().getContentAsString()).get("data").get("id").asLong();

        // Student 2 tries to return Student 1's borrowing
        mockMvc.perform(put("/api/borrowings/" + borrowingId + "/return")
                        .header("Authorization", "Bearer " + student2Token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)));
    }
}
