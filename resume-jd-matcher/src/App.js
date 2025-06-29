import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './HomePage';
import AnalyzePage from './AnalyzePage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <div className="header-container">
            <h1 className="logo">ResumeMatch AI</h1>
            <nav className="nav-links">
              <Link to="/" className="nav-link">Home</Link>
              <Link to="/analyze" className="nav-link">Analyze</Link>
            </nav>
          </div>
        </header>
        
        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/analyze" element={<AnalyzePage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;