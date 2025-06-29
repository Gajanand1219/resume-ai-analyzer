# 📄 Resume Analyzer API

A FastAPI-based resume analysis application that allows users to upload resumes, extract and parse their content using NLP (NLTK), and compare them against job descriptions to generate detailed analysis reports. The backend uses SQLite and SQLAlchemy ORM for persistence.

---

## 🚀 Features

- 📤 Upload `.pdf`, `.docx`, or `.txt` resumes
- 🧠 Extract and parse:
  - Skills (nouns, adjectives)
  - Organizations (named entities)
  - Experience (years)
- 🎯 Match resumes against job descriptions based on:
  - Skills
  - Experience
  - Education
  - Job Title Relevance
- 📊 Score each resume with:
  - Match categories
  - Suggestions for improvement
- 🗄️ Persist all data using SQLite + SQLAlchemy ORM
- 🧰 Supports multiple resumes, multiple analyses
- 🔄 Built-in NLP processing using NLTK

---

## ⚙️ Tech Stack

| Component      | Technology         |
|----------------|--------------------|
| **Backend**    | FastAPI            |
| **Database**   | SQLite + SQLAlchemy|
| **NLP**        | NLTK               |
| **File Parsing**| PyPDF2, python-docx |
| **Validation** | Pydantic           |

---

## 🧠 How It Works

### 1. Upload Resume
- Accepted formats: `.pdf`, `.docx`, `.txt`
- Stored in `uploads/` directory
- Extracts raw text content
- Parses for:
  - **Skills** (nouns, adjectives using POS tagging)
  - **Experience** (e.g., "X years")
  - **Organizations** (NER using NLTK)

### 2. Provide Job Description Input
- Provide details like:
  - Job Title
  - Required Skills
  - Minimum Experience
  - Required Education

### 3. Analyze Resume
Each resume is scored based on:

| Criteria             | Weight (%) |
|----------------------|------------|
| Skills Match         | 50%        |
| Experience Match     | 30%        |
| Education Match      | 15%        |
| Job Title Relevance  | 5%         |

- Returns:
  - Total Score
  - Detailed match breakdown
  - Suggestions for missing skills/criteria

### 4. Store Results
- Resume file and analysis results stored in database
- Linked to each resume for future reference

---

## 🚦 API Endpoints (Sample)

| Method | Endpoint              | Description               |
|--------|------------------------|---------------------------|
| POST   | `/upload/`             | Upload a resume file      |
| POST   | `/analyze/`            | Analyze resume with JD    |
| GET    | `/resumes/`            | List all resumes          |
| GET    | `/analysis/{id}`       | Get analysis by ID        |

---

