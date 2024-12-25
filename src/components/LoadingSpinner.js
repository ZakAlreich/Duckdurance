import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = () => {
  return (
    <div className="spinner-container">
      <div className="spinner"></div>
      <p>Generating your duck meme...</p>
    </div>
  );
};

export default LoadingSpinner;
