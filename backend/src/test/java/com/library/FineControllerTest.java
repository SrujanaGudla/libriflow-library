package com.library;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.library.dto.BookDto;
import com.library.dto.LoginRequest;
import com.library.dto.RegisterRequest;
import com.library.entity.Borrowing;
import com.library.entity.FineStatus;
import com.library.repository.BorrowingRepository;
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
public class FineControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private BorrowingRepository borrowingRepository;

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
        String s1Email = "fine_student1_" + System.currentTimeMillis() + "@test.com";
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new RegisterRequest("Fine Student 1", s1Email, "password123"))));
        MvcResult s1Result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(s1Email, "password123"))))
                .andExpect(status().isOk())
                .andReturn();
        this.student1Token = objectMapper.readTree(s1Result.getResponse().getContentAsString())
                .get("data").get("token").asText();

        // Student 2
        String s2Email = "fine_student2_" + System.currentTimeMillis() + "@test.com";
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new RegisterRequest("Fine Student 2", s2Email, "password123"))));
        MvcResult s2Result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(s2Email, "password123"))))
                .andExpect(status().isOk())
                .andReturn();
        this.student2Token = objectMapper.readTree(s2Result.getResponse().getContentAsString())
                .get("data").get("token").asText();
    }

    private long createBook(String title) throws Exception {
        String isbn = "ISBN-FINE-" + System.nanoTime();
        BookDto book = new BookDto(null, title, "Fine Author", "Finance", isbn, 5, null, null);
        MvcResult res = mockMvc.perform(post("/api/books")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(book)))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(res.getResponse().getContentAsString()).get("data").get("id").asLong();
    }

    @Test
    @DisplayName("Late return generates fine (lateDays * 10) with status UNPAID")
    public void testLateReturnCalculatesFine() throws Exception {
        long bookId = createBook("Algorithmic Trading");

        // Borrow book
        MvcResult borrowRes = mockMvc.perform(post("/api/borrowings/" + bookId)
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isCreated())
                .andReturn();
        long borrowingId = objectMapper.readTree(borrowRes.getResponse().getContentAsString()).get("data").get("id").asLong();

        // Simulate overdue due date (due 5 days ago)
        Borrowing borrowing = borrowingRepository.findById(borrowingId).orElseThrow();
        borrowing.setBorrowDate(LocalDate.now().minusDays(19));
        borrowing.setDueDate(LocalDate.now().minusDays(5));
        borrowingRepository.save(borrowing);

        // Return book today (5 days late) -> fine should be 5 * 10 = 50.0
        mockMvc.perform(put("/api/borrowings/" + borrowingId + "/return")
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.fineAmount", is(50.0)))
                .andExpect(jsonPath("$.data.fineStatus", is("UNPAID")));

        // Check student fines list
        mockMvc.perform(get("/api/fines/my")
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].amount", is(50.0)))
                .andExpect(jsonPath("$.data[0].lateDays", is(5)))
                .andExpect(jsonPath("$.data[0].status", is("UNPAID")))
                .andExpect(jsonPath("$.data[0].bookTitle", is("Algorithmic Trading")));
    }

    @Test
    @DisplayName("Admin can view all fines, student cannot access admin all-fines API (403 Forbidden)")
    public void testFinesAccessControl() throws Exception {
        // Student attempts to view all fines
        mockMvc.perform(get("/api/fines")
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)));

        // Admin views all fines
        mockMvc.perform(get("/api/fines")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @DisplayName("Student can pay their own fine, duplicate payment is rejected")
    public void testPayFineFlow() throws Exception {
        long bookId = createBook("Database Internals");

        // Borrow & simulate 3 days late
        MvcResult borrowRes = mockMvc.perform(post("/api/borrowings/" + bookId)
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isCreated())
                .andReturn();
        long borrowingId = objectMapper.readTree(borrowRes.getResponse().getContentAsString()).get("data").get("id").asLong();

        Borrowing borrowing = borrowingRepository.findById(borrowingId).orElseThrow();
        borrowing.setDueDate(LocalDate.now().minusDays(3));
        borrowingRepository.save(borrowing);

        // Return -> Fine = 3 * 10 = 30.0
        mockMvc.perform(put("/api/borrowings/" + borrowingId + "/return")
                .header("Authorization", "Bearer " + student1Token));

        // Get fine ID
        MvcResult finesRes = mockMvc.perform(get("/api/fines/my")
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode firstFine = objectMapper.readTree(finesRes.getResponse().getContentAsString()).get("data").get(0);
        long fineId = firstFine.get("id").asLong();

        // Pay fine
        mockMvc.perform(put("/api/fines/" + fineId + "/pay")
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("PAID")));

        // Duplicate payment attempt
        mockMvc.perform(put("/api/fines/" + fineId + "/pay")
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("already been paid")));
    }

    @Test
    @DisplayName("Student cannot pay another student's fine (403 Forbidden)")
    public void testStudentCannotPayAnotherStudentsFine() throws Exception {
        long bookId = createBook("Computer Networks");

        // Student 1 borrows & overdue
        MvcResult borrowRes = mockMvc.perform(post("/api/borrowings/" + bookId)
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isCreated())
                .andReturn();
        long borrowingId = objectMapper.readTree(borrowRes.getResponse().getContentAsString()).get("data").get("id").asLong();

        Borrowing borrowing = borrowingRepository.findById(borrowingId).orElseThrow();
        borrowing.setDueDate(LocalDate.now().minusDays(2));
        borrowingRepository.save(borrowing);

        mockMvc.perform(put("/api/borrowings/" + borrowingId + "/return")
                .header("Authorization", "Bearer " + student1Token));

        MvcResult finesRes = mockMvc.perform(get("/api/fines/my")
                        .header("Authorization", "Bearer " + student1Token))
                .andReturn();
        long fineId = objectMapper.readTree(finesRes.getResponse().getContentAsString()).get("data").get(0).get("id").asLong();

        // Student 2 attempts to pay Student 1's fine
        mockMvc.perform(put("/api/fines/" + fineId + "/pay")
                        .header("Authorization", "Bearer " + student2Token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)));
    }
}
