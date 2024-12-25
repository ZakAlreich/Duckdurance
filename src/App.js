import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import StravaAuth from './components/StravaAuth';
import StravaCallback from './components/StravaCallback';
import Dashboard from './components/Dashboard';
import DuckMemeGenerator from './components/DuckMemeGenerator';
import { SettingsProvider } from './context/SettingsContext';
import { MemeProvider } from './context/MemeContext';

function App() {
  return (
    <SettingsProvider>
      <MemeProvider>
        <Router>
          <Routes>
            <Route path="/" element={<StravaAuth />} />
            <Route path="/auth/strava/callback" element={<StravaCallback />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/generate-meme/:activityId" element={<DuckMemeGenerator />} />
          </Routes>
        </Router>
      </MemeProvider>
    </SettingsProvider>
  );
}

export default App;