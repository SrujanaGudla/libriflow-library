# LibriFlow - Full-Stack Library Management System

A modern, role-based full-stack Library Management System built with **React.js + Vite** on the frontend and **Spring Boot + Spring Security + Spring Data JPA + MySQL** on the backend.

---

## 🛠️ Technology Stack

### Backend
- **Java 17 / 21+**
- **Spring Boot 3.3.x**
- **Spring Security** (Role-based authorization: `ADMIN`, `STUDENT`)
- **JSON Web Tokens (jjwt 0.12.5)** for stateless authentication
- **Spring Data JPA & Hibernate**
- **MySQL 8.0+**
- **Maven**
- **BCrypt** password hashing

### Frontend
- **React 18**
- **Vite**
- **React Router v6**
- **Axios** (with JWT Bearer interceptor)
- **Lucide React** (modern iconography)
- **Vanilla CSS3** (Custom design system, glassmorphism, responsive UI)

---

## 📁 Project Structure

```
library/
├── backend/                               # Spring Boot Application
│   ├── pom.xml                            # Maven dependencies & build config
│   └── src/
│       └── main/
│           ├── java/com/library/
│           │   ├── LibraryManagementSystemApplication.java
│           │   ├── controller/            # REST API Controllers (Auth, Book, Borrowing, Fine)
│           │   ├── service/               # Business logic & transaction handling
│           │   ├── repository/            # Spring Data JPA Repositories
│           │   ├── entity/                # JPA Database Entities (User, Role, Book, Borrowing, Fine)
│           │   ├── dto/                   # Request/Response Data Transfer Objects
│           │   ├── security/              # JWT Auth filter, token provider, UserDetails
│           │   ├── config/                # SecurityFilterChain, CORS, PasswordEncoder beans
│           │   └── exception/             # GlobalExceptionHandler, Custom exception classes
│           └── resources/
│               └── application.properties # DB & JWT application configurations
│
├── frontend/                              # React + Vite Application
│   ├── package.json                       # Dependencies & scripts
│   ├── vite.config.js                     # Vite build & proxy settings
│   ├── index.html                         # HTML template & fonts
│   └── src/
│       ├── main.jsx                       # React DOM entrypoint
│       ├── App.jsx                        # Application root & router
│       ├── components/                    # Reusable UI components (Navbar, Modals, Cards)
│       ├── pages/                         # Page views (Dashboards, Catalog, Auth pages)
│       ├── context/                       # React Context (AuthContext)
│       ├── services/                      # Axios API service callers
│       ├── styles/                        # Design tokens, CSS variables & global styling
│       └── assets/                        # Static icons, banners & images
│
├── .gitignore
└── README.md
```

---

## 🗄️ Database Setup (MySQL)

1. Ensure MySQL server is running on port `3306`.
2. Create the database (optional if auto-creation is enabled in `application.properties`):
   ```sql
   CREATE DATABASE IF NOT EXISTS library_db;
   ```
3. Update `backend/src/main/resources/application.properties` with your MySQL credentials:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/library_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true&createDatabaseIfNotExist=true
   spring.datasource.username=root
   spring.datasource.password=your_mysql_password
   ```

---

## 🚀 How to Run the Project

### 1. Backend Setup & Startup
```bash
cd backend
mvn clean install
mvn spring-boot:run
```
*The backend REST API will be accessible at: `http://localhost:8080`*

### 2. Frontend Setup & Startup
```bash
cd frontend
npm install
npm run dev
```
*The frontend application will be running at: `http://localhost:5173`*

## ⚙️ Environment Configuration

### React / Vite frontend

Copy `frontend/.env.example` to `frontend/.env` and set `VITE_API_BASE_URL` to the API URL:

```text
VITE_API_BASE_URL=http://localhost:8080/api
```

Vite reads this value when it starts or builds the frontend. For deployment, set
`VITE_API_BASE_URL` in the frontend build environment to the deployed API URL, or
`/api` when the frontend and backend share a domain and `/api` is routed to the backend.
Values prefixed with `VITE_` are included in browser code, so never put passwords,
database credentials, or JWT secrets in the frontend environment file.

### Java / Spring Boot backend

Spring Boot reads configuration from environment variables, not from a `.env` file.
Set these variables in the backend deployment platform's environment/secrets settings:

| Variable | Purpose |
| --- | --- |
| `PORT` | Backend listening port (defaults to `8080`) |
| `DB_URL` | MySQL JDBC connection URL |
| `DB_USERNAME` | MySQL username |
| `DB_PASSWORD` | MySQL password |
| `JWT_SECRET` | Secret used to sign authentication tokens; required |
| `JWT_EXPIRATION_MS` | Token lifetime in milliseconds (defaults to `86400000`) |
| `CORS_ALLOWED_ORIGINS` | Comma-separated list of allowed frontend origins |

Node.js is used to install dependencies and build/run the Vite frontend; this project
does not have a separate Node.js backend. Keep real `.env` files and credentials out
of Git. The committed `frontend/.env.example` is a safe template, not a place for secrets.

---

## 🔐 Default Admin Account Creation

On initial application startup, the system seeds the default roles (`ROLE_ADMIN`, `ROLE_STUDENT`) and an initial Administrator account:
- **Email/Username**: `admin@library.com`
- **Password**: `admin123`
- **Role**: `ADMIN`

Students can register self-service via the Register page (`/register`).

---

## 📡 REST API Endpoints Overview

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new Student account |
| `POST` | `/api/auth/login` | Public | Authenticate user & retrieve JWT token |
| `GET`  | `/api/auth/me` | Authenticated | Retrieve profile and role of active user |

### Books Management (`/api/books`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET`  | `/api/books` | Public / Student / Admin | Get all books (with search & filter) |
| `GET`  | `/api/books/{id}` | Public / Student / Admin | Get book by ID |
| `POST` | `/api/books` | **ADMIN only** | Create a new book |
| `PUT`  | `/api/books/{id}` | **ADMIN only** | Update an existing book |
| `DELETE` | `/api/books/{id}` | **ADMIN only** | Delete a book |

### Borrowing Operations (`/api/borrowings`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/borrowings/borrow` | **STUDENT** | Request to borrow an available book |
| `POST` | `/api/borrowings/{id}/return` | **STUDENT / ADMIN** | Return a borrowed book |
| `GET`  | `/api/borrowings/my-borrowings` | **STUDENT** | View logged-in student's borrowings |
| `GET`  | `/api/borrowings` | **ADMIN** | View all system-wide borrowings |

### Fines (`/api/fines`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET`  | `/api/fines/my-fines` | **STUDENT** | View logged-in student's active & paid fines |
| `POST` | `/api/fines/{id}/pay` | **STUDENT** | Settle overdue fine |
| `GET`  | `/api/fines` | **ADMIN** | View all fines across students |

---

## 🛡️ Role & Permission Matrix

| Feature / UI | ADMIN | STUDENT |
| :--- | :---: | :---: |
| **Login / Register** | ✅ | ✅ |
| **Dashboard** | Dedicated Admin Dashboard | Dedicated Student Portal |
| **View / Search Catalog** | ✅ | ✅ |
| **Add / Edit / Delete Books** | ✅ | ❌ *(Hidden & Forbidden at API level)* |
| **Borrow Books** | ❌ | ✅ |
| **View Active Loans & History**| System-Wide | Student's Own Loans |
| **View & Pay Fines** | System-Wide Overview | Student's Own Fines |
