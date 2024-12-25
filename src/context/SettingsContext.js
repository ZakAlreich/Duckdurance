import React, { createContext, useState, useContext } from 'react';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [autoUploadToStrava, setAutoUploadToStrava] = useState(
    localStorage.getItem('autoUploadToStrava') === 'true'
  );

  const toggleAutoUpload = () => {
    const newValue = !autoUploadToStrava;
    setAutoUploadToStrava(newValue);
    localStorage.setItem('autoUploadToStrava', newValue);
  };

  return (
    <SettingsContext.Provider value={{ autoUploadToStrava, toggleAutoUpload }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext); 