# MedMan-Ai: Healthcare Appointment & Follow-up Manager

![Project Status](https://img.shields.io/badge/Status-Completed-success)
![Java](https://img.shields.io/badge/Java-17-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.3-brightgreen)
![React](https://img.shields.io/badge/React-Vite-blue)
![Python](https://img.shields.io/badge/Python-FastAPI-yellow)

**MedMan-Ai** is a comprehensive, full-stack Healthcare Appointment and Follow-up Management system. It is designed to streamline the workflow between Patients, Doctors, and Hospital Administrators while leveraging advanced LLM (Large Language Model) capabilities via the Gemini API for intelligent medical data processing.

---

## 🚀 Key Features

* **Role-Based Portals:** 
  * **Patient Portal:** Book, manage, and track medical appointments.
  * **Doctor Portal:** View schedules, manage patient follow-ups, and review symptoms.
  * **Admin Portal:** Manage doctors, users, and overall hospital scheduling infrastructure.
* **Intelligent LLM Integration:** Python microservice using Google Gemini API to analyze patient symptoms and provide summarized insights.
* **Robust Backend:** Built with Java Spring Boot, implementing JWT-based authentication, exception handling, and scheduled background jobs (e.g., automated email reminders for medication and appointments).
* **High-Performance Architecture:** PostgreSQL for relational data storage and Redis for caching and distributed locking (e.g., holding appointment slots).

---

## 🛠️ Technology Stack

* **Frontend:** React.js, Vite, Tailwind CSS
* **Backend:** Java 17, Spring Boot (Data JPA, Security, Mail), PostgreSQL, Redis, Maven
* **AI Microservice:** Python 3, FastAPI, Google Gemini API (via LangChain/Custom integration)

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your machine:
* **Java 17**
* **Node.js** (v16+)
* **Python** (3.9+)
* **PostgreSQL** (Running locally, with a database created)
* **Redis** (Running locally on default port `6379`)
* **Maven** (or use the provided Maven installation instructions below)

---

## ⚙️ Setup & Installation

Follow these steps to set up the project locally. The project is divided into three main components: `backend`, `frontend`, and `llm-service`.

### 1. Database Setup (PostgreSQL)
Ensure your PostgreSQL server is running. Open your terminal or `pgAdmin` and create the required database:
```sql
CREATE DATABASE healthcare;
```

### 2. Backend Setup (Spring Boot)
Navigate to the backend directory:
```bash
cd backend
```
**Configure Environment Variables:**
Copy the `.env.example` file to create a `.env` file (or set these in your `application.properties`):
```properties
DB_URL=jdbc:postgresql://localhost:5432/healthcare
DB_USERNAME=postgres
DB_PASSWORD=your_password
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your_super_secret_jwt_key_here
```

**Run the Backend:**
If you have Maven installed globally:
```bash
mvn spring-boot:run
```
*(If you do not have Maven installed, you can download it directly to your folder using PowerShell:)*
```powershell
Invoke-WebRequest -Uri "https://archive.apache.org/dist/maven/maven-3/3.9.9/binaries/apache-maven-3.9.9-bin.zip" -OutFile "maven.zip"
Expand-Archive -Path "maven.zip" -DestinationPath "." -Force
.\apache-maven-3.9.9\bin\mvn.cmd spring-boot:run
```

### 3. AI Service Setup (Python FastAPI)
Navigate to the LLM service directory:
```bash
cd llm-service
```
**Configure Environment Variables:**
Copy `.env.example` to `.env` and add your Gemini API Key:
```env
GEMINI_API_KEY=your_google_gemini_api_key_here
PORT=8000
```
**Install Dependencies and Run:**
```bash
# Create a virtual environment (Recommended)
python -m venv venv
venv\Scripts\activate   # On Windows
# source venv/bin/activate # On Mac/Linux

# Install requirements
pip install -r requirements.txt

# Run the FastAPI server
uvicorn main:app --reload --port 8000
```

### 4. Frontend Setup (React / Vite)
Navigate to the frontend directory:
```bash
cd frontend
```
**Install Dependencies and Run:**
```bash
npm install
npm run dev
```
The frontend will start on `http://localhost:5173`.

---

## 📁 Project Structure

```text
MedMan-Ai/
├── backend/               # Java Spring Boot REST API
│   ├── src/main/java      # Controllers, Services, Repositories, Models, Jobs
│   └── pom.xml            # Maven Dependencies
├── frontend/              # React Vite Application
│   ├── src/               # React Components, Pages, State management (Zustand/Redux)
│   └── package.json       # Node Dependencies
├── llm-service/           # Python FastAPI AI Microservice
│   ├── main.py            # API Endpoints
│   ├── llm_client.py      # Gemini API Connection Logic
│   └── requirements.txt   # Python Dependencies
└── README.md              # Project Documentation
```

---

## ✨ Design & Architecture Highlights
- **Microservice Architecture:** Decoupling the heavy LLM AI processing into a separate Python microservice ensures the core Java backend remains blazing fast and unblocked.
- **Background Jobs:** Utilizes Spring Boot `@Scheduled` annotations to process asynchronous tasks like cleaning up expired appointment holds and sending medication reminder emails.
- **Security:** Fully protected API endpoints using Spring Security and JWT. The frontend routes use AuthGuards to prevent unauthorized access to Portal components.

---

## 🤝 Contribution
This project is currently finalized as part of a phase 1 submission. Feel free to fork and enhance!

## 📜 License
This project is licensed under the MIT License.
