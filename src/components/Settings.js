import React from 'react';
import { useSettings } from '../context/SettingsContext';
import './Settings.css';

const Settings = () => {
  const { autoUploadToStrava, toggleAutoUpload } = useSettings();

  return (
    <div className="settings-container">
      <div className="setting-item">
        <label className="setting-label">
          <input
            type="checkbox"
            checked={autoUploadToStrava}
            onChange={toggleAutoUpload}
          />
          Automatically upload memes to Strava
        </label>
        <p className="setting-description">
          When enabled, generated memes will be automatically uploaded to your Strava activities
        </p>
      </div>
    </div>
  );
};

export default Settings; 