import React, { createContext, useState, useContext } from 'react';

const MemeContext = createContext();

export const MemeProvider = ({ children }) => {
  const [generatedMemes, setGeneratedMemes] = useState({});

  const addMeme = (activityId, memeUrl) => {
    setGeneratedMemes(prev => ({
      ...prev,
      [activityId]: memeUrl
    }));
  };

  return (
    <MemeContext.Provider value={{ generatedMemes, addMeme }}>
      {children}
    </MemeContext.Provider>
  );
};

export const useMemes = () => useContext(MemeContext); 