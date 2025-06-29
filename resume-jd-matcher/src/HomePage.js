import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

function HomePage() {
  const [resumeFile, setResumeFile] = useState(null);
  const navigate = useNavigate();

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setResumeFile(file);
      
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const response = await fetch('http://localhost:8000/upload-resume/', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        console.log('Upload success:', data);
      } catch (error) {
        console.error('Upload error:', error);
      }
    }
  };

  const handleAnalyzeClick = () => {
    navigate('/analyze');
  };

  return (
    <div className="home-container">
      <section className="hero-section">
        <div className="hero-content">
          <h1>Match Your Resume to Job Descriptions with AI</h1>
          <p className="subtitle">Get personalized insights to improve your resume and increase your chances of landing interviews</p>
          <div className="cta-buttons">
            <button 
              className="button primary"
              onClick={handleAnalyzeClick}
              disabled={!resumeFile}
            >
              Analyze Resume
            </button>
          </div>
        </div>
        <div className="hero-image">
          <img src="https://illustrations.popsy.co/amber/career-progress.svg" alt="Career progress" />
        </div>
      </section>

      <section className="upload-section card">
        <h2>Upload Your Resume</h2>
        <div className="upload-box">
          <div className="file-upload">
            <input 
              type="file" 
              id="resume-upload" 
              accept=".pdf,.docx,.txt" 
              onChange={handleFileUpload}
            />
            <label htmlFor="resume-upload" className="upload-button">
              {resumeFile ? (
                <span className="file-name">{resumeFile.name}</span>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  <span>Choose File</span>
                </>
              )}
            </label>
          </div>
          <p className="file-info">Supported formats: PDF, DOCX, TXT</p>
        </div>
      </section>

      <section className="features-section">
        <h2 className="section-title">How It Works</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
            </div>
            <h3>AI-Powered Analysis</h3>
            <p>Our advanced algorithms analyze your resume against job descriptions to find the best matches.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
            </div>
            <h3>Skill Gap Identification</h3>
            <p>Discover which skills you're missing and get recommendations to improve your profile.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 17 10 11 4 5"></polyline>
                <line x1="12" y1="19" x2="20" y2="19"></line>
              </svg>
            </div>
            <h3>Personalized Suggestions</h3>
            <p>Get actionable advice tailored to your resume and target job positions.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;