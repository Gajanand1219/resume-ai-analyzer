import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AnalyzePage.css';

function AnalyzePage() {
  const [resumes, setResumes] = useState([]);
  const [jdData, setJdData] = useState({
    jobTitle: '',
    jobDescription: '',
    skills: '',
    experience: '',
    education: '',
    company: ''
  });
  const [analysisResults, setAnalysisResults] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const response = await fetch('http://localhost:8000/resumes/');
      const data = await response.json();
      setResumes(data);
    } catch (error) {
      console.error('Error fetching resumes:', error);
    }
  };

  const handleJdChange = (e) => {
    const { name, value } = e.target;
    setJdData(prev => ({ ...prev, [name]: value }));
  };

// In AnalyzePage.js, replace handleAnalyze function with:
const handleAnalyze = async () => {
  if (resumes.length === 0) return;

  setIsAnalyzing(true);
  try {
    const formData = new FormData();
    formData.append('job_title', jdData.jobTitle);
    formData.append('job_description', jdData.jobDescription);
    formData.append('required_skills', jdData.skills);
    formData.append('experience', jdData.experience);
    formData.append('education', jdData.education);
    if (jdData.company) formData.append('company', jdData.company);

    const response = await fetch('http://localhost:8000/analyze-all/', {
      method: 'POST',
      body: formData,
    });
    const results = await response.json();
    
    // Map results to include resume data
    const mappedResults = results.map(result => {
      const resume = resumes.find(r => r.id === result.resume_id);
      return { resume, analysis: result };
    });
    
    setAnalysisResults(mappedResults);
  } catch (error) {
    console.error('Analysis error:', error);
  } finally {
    setIsAnalyzing(false);
  }
};

  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--success-color)';
    if (score >= 60) return 'var(--warning-color)';
    return 'var(--danger-color)';
  };

  const renderScoreCircle = (score) => {
    const displayScore = score || 0;
    const color = getScoreColor(displayScore);
    return (
      <div className="score-circle">
        <svg width="80" height="80" viewBox="0 0 36 36" className="circular-chart">
          <path className="circle-bg"
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path className="circle-fill"
            strokeDasharray={`${displayScore}, 100`}
            stroke={color}
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <text x="18" y="20.5" className="percentage">{displayScore}%</text>
        </svg>
      </div>
    );
  };

  const renderMatchBreakdown = (matches = []) => {
    return matches.map((match, index) => (
      <div key={index} className="breakdown-item">
        <div className="breakdown-header">
          <span className="breakdown-category">{match.category}</span>
          <span className="breakdown-score" style={{ color: getScoreColor(match.score) }}>
            {match.score}%
          </span>
        </div>
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill" 
            style={{ 
              width: `${match.score}%`,
              backgroundColor: getScoreColor(match.score)
            }}
          ></div>
        </div>
        
        {match.matched_items && match.matched_items.length > 0 && (
          <div className="matched-items">
            <span className="matched-label">Matched:</span>
            <ul>
              {match.matched_items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        
        {match.missing_items && match.missing_items.length > 0 && (
          <div className="missing-items">
            <span className="missing-label">Missing:</span>
            <ul>
              {match.missing_items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    ));
  };

const renderResumeInsights = (insights) => {
    return (
      <div className="insights-box">
        <h4>Resume Insights</h4>
        <div className="insights-grid">
          <div className="insight-item">
            <span className="insight-label">Top Skills:</span>
            <ul>
              {insights.top_skills?.map((skill, i) => (
                <li key={i}>{skill}</li>
              ))}
            </ul>
          </div>
          <div className="insight-item">
            <span className="insight-label">Experience:</span>
            <span>{insights.experience_years} years</span>
          </div>
          <div className="insight-item">
            <span className="insight-label">Education:</span>
            <ul>
              {insights.education_level?.map((edu, i) => (
                <li key={i}>{edu}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
};

  return (
    <div className="analyze-container">
      <div className="analyze-header">
        <h1>Resume Analyzer</h1>
        <p>Upload resumes and analyze them against job descriptions to find the best matches</p>
      </div>

      <div className="analyze-grid">
        <div className="resumes-panel card">
          <h2>Uploaded Resumes</h2>
          <p className="resume-count">{resumes.length} resumes</p>
          
          {resumes.length === 0 ? (
            <div className="empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <p>No resumes uploaded yet</p>
              <button 
                className="button secondary"
                onClick={() => navigate('/')}
              >
                Upload Resumes
              </button>
            </div>
          ) : (
            <ul className="resume-list">
              {resumes.map((resume, index) => (
                <li key={index} className="resume-item">
                  <div className="resume-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                  </div>
                  <span className="resume-name">{resume.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="form-panel card">
          <h2>Job Description Analysis</h2>
          <form className="analysis-form">
            <div className="form-group">
              <label>Job Title*</label>
              <input
                type="text"
                name="jobTitle"
                value={jdData.jobTitle}
                onChange={handleJdChange}
                placeholder="e.g. Software Engineer"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Job Description*</label>
              <textarea
                name="jobDescription"
                value={jdData.jobDescription}
                onChange={handleJdChange}
                placeholder="Paste the full job description here"
                rows="4"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Required Skills</label>
              <textarea
                name="skills"
                value={jdData.skills}
                onChange={handleJdChange}
                placeholder="List skills separated by commas (e.g. Python, Java, Project Management)"
                rows="3"
              />
            </div>
            
            <div className="form-group">
              <label>Experience (Optional)</label>
              <input
                type="text"
                name="experience"
                value={jdData.experience}
                onChange={handleJdChange}
                placeholder="e.g. 5+ years in web development"
              />
            </div>
            
            <div className="form-group">
              <label>Education Requirements</label>
              <input
                type="text"
                name="education"
                value={jdData.education}
                onChange={handleJdChange}
                placeholder="e.g. Bachelor's Degree in Computer Science"
              />
            </div>
            
            <div className="form-group">
              <label>Company (Optional)</label>
              <input
                type="text"
                name="company"
                value={jdData.company}
                onChange={handleJdChange}
                placeholder="e.g. Google, Amazon"
              />
            </div>
            
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isAnalyzing || !jdData.jobTitle || !jdData.jobDescription || resumes.length === 0}
              className="button primary analyze-button"
            >
              {isAnalyzing ? (
                <>
                  <svg className="spinner" viewBox="0 0 50 50">
                    <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                  </svg>
                  Analyzing...
                </>
              ) : 'Analyze All Resumes'}
            </button>
          </form>
        </div>
      </div>

      {analysisResults.length > 0 && (
        <div className="results-section">
          <h2>Analysis Results</h2>
          <p className="results-subtitle">{analysisResults.length} resumes analyzed</p>
          
          <div className="results-grid">
            {analysisResults.map((result, index) => {
              const analysis = result.analysis || {};
              const matches = analysis.matches || [];
              const suggestions = analysis.suggestions || [];
              const insights = analysis.resume_insights || {};
              
              return (
                <div key={index} className="result-card card">
                  <div className="result-header">
                    <h3 className="resume-title">{result.resume.name}</h3>
                    <div 
                      className="overall-score" 
                      style={{ backgroundColor: getScoreColor(analysis.overall_score || 0) }}
                    >
                      {analysis.overall_score || 0}% Match
                    </div>
                  </div>
                  
                  <div className="result-content">
                    <div className="score-cards">
                      <h4>Key Metrics</h4>
                      <div className="score-container">
                      {matches.slice(0, 3).map((match, i) => (
                        <div key={i} className="score-item">
                          {renderScoreCircle(match.score)}
                          <span>{match.category}</span>
                        </div>
                      ))}
                    </div>
                    </div>

                    <div className="match-breakdown">
                      <h4>Detailed Match Breakdown</h4>
                      {renderMatchBreakdown(matches)}
                    </div>

                    {renderResumeInsights(insights)}

                    <div className="suggestions-box">
                      <h4>Suggestions for Improvement</h4>
                      <ul>
                        {suggestions.map((suggestion, i) => (
                          <li key={i}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default AnalyzePage;