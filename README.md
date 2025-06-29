# Resume AI Analyzer





https://github.com/user-attachments/assets/b5fc2b90-eafa-4954-892d-f626056c019d




This project is a **FastAPI-based web service** for analyzing resumes against job descriptions (JD). It uses **rule-based Natural Language Processing (NLP)** techniques to extract key information (skills, experience, education) and compare them with job requirements provided via form data. 

While the code uses basic NLP tools (`nltk`) and text extraction libraries (`PyPDF2`, `python-docx`), it **does not** currently include advanced machine learning or AI models. The scoring system is heuristic, based on matching keywords and phrases.

---

## 🚀 Features

✅ Upload resumes (PDF, DOCX, TXT) via API.  

✅ Extract:
- Skills (noun/adjective phrases) from resume text.
- Years of experience using regular expressions.
- Organization mentions using named entity recognition.  

✅ Compare extracted data with job description form data, including:
- Required skills.
- Required experience (years).
- Required education.
- Job title relevance.

✅ Generate:
- An **overall score** based on weighted matching criteria.
- **Category-wise scores** (skills, experience, education, title relevance).
- **Suggestions** on how the resume can be improved.
- Resume insights (top extracted skills, detected experience, matched education).

✅ Store all data in a **SQLite database** (`data/resume_analyzer.db`).

✅ Simple, extendable codebase — ready to integrate more advanced NLP or ML models.

---

## ⚙️ Setup Instructions

### 1️⃣ Install Python Dependencies

First, make sure you have Python 3.8+ installed. Then run:

```bash
pip install -r requirements.txt


git clone https://github.com/Gajanand1219/resume-ai-analyzer.git
cd resume-ai-analyzer


## 📂 Project Structure
resune_build/
│
├── backend/
│   ├── main.py               # Main FastAPI server application
│   ├── data/
│   │   └── resume_analyzer.db   # SQLite database (auto-created)
│   ├── uploads/
│   │   ├── <uploaded resumes>   # Uploaded resume files (.pdf, .docx, .txt)
│   ├── requirements.txt      # Python dependencies list
│   ├── README.md             # Project documentation
│   ├── utils.py              # (Optional) helper utilities
│   ├── models.py             # (Optional) ORM models
│   ├── schemas.py            # (Optional) Pydantic schemas
│   └── __pycache__/          # Python bytecode cache
│
├── resume-jd-matcher/
│   ├── matcher.py            # (Example) matching logic module
│   ├── helpers.py            # (Example) shared helper functions
│   ├── README.md             # Submodule readme (if needed)
│   └── __pycache__/          # Python bytecode cache
│
└── README.md                 # Root project readme (overview, usage, setup)
