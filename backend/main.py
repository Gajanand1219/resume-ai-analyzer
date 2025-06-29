from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, String, Text, DateTime, Float, JSON, ForeignKey
from sqlalchemy.orm import sessionmaker, declarative_base, Session, relationship
from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict, Any
from collections import defaultdict
from datetime import datetime
import os, uuid, logging, re, nltk, docx, PyPDF2

# ========== Configuration ==========
UPLOAD_DIR = "uploads"; os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs("data", exist_ok=True)
DATABASE_URL = "sqlite:///data/resume_analyzer.db"
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn.error")

# ========== DB Setup ==========
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False}, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ========== ORM Models ==========
class Resume(Base):
    __tablename__ = "resumes"
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    upload_date = Column(DateTime, default=datetime.utcnow)
    content = Column(Text, default="")
    parsed_data = Column(JSON, default=dict)
    analyses = relationship("Analysis", back_populates="resume", cascade="all, delete-orphan")

class Analysis(Base):
    __tablename__ = "analyses"
    id = Column(String, primary_key=True, index=True)
    resume_id = Column(String, ForeignKey("resumes.id", ondelete="CASCADE"))
    overall_score = Column(Float, default=0.0)
    matches = Column(JSON, default=list)
    suggestions = Column(JSON, default=list)
    resume_insights = Column(JSON, default=dict)
    analysis_date = Column(DateTime, default=datetime.utcnow)
    resume = relationship("Resume", back_populates="analyses")

Base.metadata.create_all(bind=engine)

# ========== Pydantic Schemas ==========
class _Config:
    model_config = ConfigDict(from_attributes=True)

class ResumeOut(BaseModel):
    id: str
    name: str
    model_config = ConfigDict(from_attributes=True)

class MatchCategory(BaseModel):
    category: str
    score: float
    matched_items: List[str]
    missing_items: List[str]
    details: Optional[str] = None

class AnalysisResultSchema(BaseModel):
    id: str
    resume_id: str
    overall_score: float
    matches: List[MatchCategory]
    suggestions: List[str]
    resume_insights: Dict[str, Any]
    analysis_date: datetime
    model_config = ConfigDict(from_attributes=True)

# ========== NLP Tools ==========
for pkg in ["punkt", "averaged_perceptron_tagger", "maxent_ne_chunker", "words"]:
    try:
        nltk.data.find(pkg)
    except LookupError:
        nltk.download(pkg.split("/")[-1])

# ========== Utility Functions ==========
def extract_text_from_file(path: str) -> str:
    try:
        if path.lower().endswith(".pdf"):
            with open(path, "rb") as f:
                r = PyPDF2.PdfReader(f)
                return " ".join(filter(None, (p.extract_text() for p in r.pages)))
        if path.lower().endswith(".docx"):
            d = docx.Document(path)
            return " ".join(p.text for p in d.paragraphs if p.text)
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as exc:
        logger.exception("Extraction error: %s", exc)
        return ""

def extract_entities(text: str) -> Dict[str, Any]:
    try:
        clean = re.sub(r"\s+", " ", text).strip()
        tokens = nltk.word_tokenize(clean)
        tagged = nltk.pos_tag(tokens)

        # Extract all nouns and adjectives as potential skills
        skills = {w.lower() for w, p in tagged if p in {"NN","NNS","JJ"}}
        
        # Organizations extraction
        orgs = []
        for ent in nltk.ne_chunk(tagged):
            if isinstance(ent, nltk.tree.Tree) and ent.label()=="ORGANIZATION":
                orgs.append(" ".join(w for w,_ in ent.leaves()))

        # Experience extraction
        exp = 0
        for n in re.findall(r"(\d+)\+?\s*(?:yrs?|years?)", clean, flags=re.I):
            num = int(n)
            if num < 40:
                exp = max(exp, num)

        return {
            "skills": list(skills),
            "experience_years": exp,
            "organizations": orgs
        }
    except Exception as exc:
        logger.exception("Entity parse error: %s", exc)
        return {"skills": [], "experience_years": 0, "organizations": []}

def calculate_match_score(resume_data: Dict[str, Any], jd_data: Dict[str, Any], resume_text: str) -> AnalysisResultSchema:
    result_id = str(uuid.uuid4())
    suggestions, matches = [], []

    # Skills matching - compare against required skills from form
    req_skills = [s.strip().lower() for s in jd_data["required_skills"].split(',') if s.strip()]
    matched_skills = _find_skills_in_text(req_skills, resume_text)
    missing_skills = sorted(set(req_skills) - set(matched_skills))
    skills_score = len(matched_skills) / len(req_skills) if req_skills else 0
    matches.append(MatchCategory(
        category="Skills Match", 
        score=round(skills_score*100,1), 
        matched_items=matched_skills, 
        missing_items=missing_skills, 
        details=f"{len(matched_skills)} / {len(req_skills)} skills matched"
    ))
    if missing_skills:
        suggestions.append("Add or highlight: " + ", ".join(missing_skills))

    # Experience matching
    resume_exp = resume_data.get("experience_years", 0)
    req_exp = int(jd_data.get("experience",0) or 0)
    exp_score = min(resume_exp / max(req_exp,1), 1) if req_exp else 1
    matches.append(MatchCategory(
        category="Experience Match", 
        score=round(exp_score*100,1), 
        matched_items=[f"{resume_exp} years"], 
        missing_items=[f"{req_exp} years required"] if resume_exp < req_exp else [], 
        details=f"Has {resume_exp} vs needs {req_exp}"
    ))
    if resume_exp < req_exp:
        suggestions.append("Emphasise transferable experience.")

    # Education matching - compare against education requirements from form
    req_edu = {e.strip().lower() for e in jd_data["education"].split(',') if e.strip()}
    matched_edu = []
    if req_edu:
        # Find education mentions in resume text that match form requirements
        edu_pattern = re.compile(r"\b(" + "|".join(map(re.escape, req_edu)) + r")\b", re.I)
        matched_edu = list(set(edu_pattern.findall(resume_text.lower())))
    
    edu_score = len(matched_edu) / len(req_edu) if req_edu else 1
    matches.append(MatchCategory(
        category="Education Match", 
        score=round(edu_score*100,1), 
        matched_items=matched_edu, 
        missing_items=list(req_edu - set(matched_edu)), 
        details=f"Meets {len(matched_edu)} of {len(req_edu)} requirements" if req_edu else "No education requirements specified"
    ))

    # Job title relevance - compare against the job title from form
    required_title = jd_data["job_title"].lower().split()
    title_words_in_resume = sum(1 for word in required_title if re.search(rf"\b{re.escape(word)}\b", resume_text.lower()))
    title_score = title_words_in_resume / len(required_title) if required_title else 0
    matches.append(MatchCategory(
        category="Title Relevance", 
        score=round(title_score*100,1), 
        matched_items=[jd_data["job_title"]], 
        missing_items=[], 
        details=f"{title_words_in_resume} of {len(required_title)} keywords matched"
    ))

    # Weighted scoring
    weights = {
        "Skills Match": 0.5,
        "Experience Match": 0.3,
        "Education Match": 0.15,
        "Title Relevance": 0.05
    }
    overall = sum(m.score*weights[m.category] for m in matches)

    return AnalysisResultSchema(
        id=result_id,
        resume_id=jd_data["resume_id"],
        overall_score=round(overall,1),
        matches=matches,
        suggestions=suggestions,
        resume_insights={
            "top_skills": matched_skills[:5],
            "experience_years": resume_exp,
            "matched_education": matched_edu,
        },
        analysis_date=datetime.utcnow(),
    )


def _find_skills_in_text(required: List[str], text: str) -> List[str]:
    lower = text.lower()
    return [s for s in required if re.search(rf"\b{re.escape(s.lower())}\b", lower)]


skills_db = defaultdict(list)
job_titles_db: List[str] = []

def update_skills_database(resume_id: str, skills: List[str]):
    for s in skills:
        if resume_id not in skills_db[s]:
            skills_db[s].append(resume_id)

def update_job_titles_database(title: str):
    if title.lower() not in (t.lower() for t in job_titles_db):
        job_titles_db.append(title)

# ========== FastAPI App ==========
app = FastAPI(title="Resume Analyzer API v2")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.post("/upload-resume/", response_model=ResumeOut)
async def upload_resume(file: UploadFile = File(...), db: Session = Depends(get_db)):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in {'.pdf','.docx','.txt'}:
        raise HTTPException(status_code=400, detail="Unsupported file format")
    rid = str(uuid.uuid4())
    path = os.path.join(UPLOAD_DIR, f"{rid}{ext}")
    with open(path, 'wb') as bf:
        bf.write(await file.read())
    text = extract_text_from_file(path)
    parsed = extract_entities(text)
    db.add(Resume(id=rid, name=file.filename, file_path=path, content=text, parsed_data=parsed))
    db.commit()
    update_skills_database(rid, parsed.get("skills", []))
    return ResumeOut(id=rid, name=file.filename)

@app.get("/resumes/", response_model=List[ResumeOut])
async def list_resumes(db: Session = Depends(get_db)):
    return db.query(Resume).all()

@app.post("/analyze-all/", response_model=List[AnalysisResultSchema])
async def analyze_all(job_title: str = Form(...), job_description: str = Form(...), required_skills: str = Form(...), experience: str = Form(...), education: str = Form(...), company: Optional[str] = Form(None), db: Session = Depends(get_db)):
    resumes = db.query(Resume).all()
    if not resumes:
        raise HTTPException(status_code=404, detail="No resumes uploaded")
    outs = []
    for r in resumes:
        jd = {"resume_id": r.id, "job_title": job_title, "job_description": job_description, "required_skills": required_skills, "experience": experience, "education": education, "company": company}
        out = calculate_match_score(r.parsed_data, jd, r.content)
        outs.append(out)
        db.add(Analysis(id=out.id, resume_id=r.id, overall_score=out.overall_score, matches=[m.dict() for m in out.matches], suggestions=out.suggestions, resume_insights=out.resume_insights))
    db.commit()
    update_job_titles_database(job_title)
    return outs

# @app.get("/analysis-results/", response_model=List[AnalysisResultSchema])
# async def analysis_results(db: Session = Depends(get_db)):
#     alls = db.query(Analysis).all()
#     return [AnalysisResultSchema(id=a.id, resume_id=a.resume_id, overall_score=a.overall_score, matches=[MatchCategory(**m) for m in a.matches], suggestions=a.suggestions, resume_insights=a.resume_insights, analysis_date=a.analysis_date) for a in alls]

if __name__ == "__main__":
    import uvicorn; uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
