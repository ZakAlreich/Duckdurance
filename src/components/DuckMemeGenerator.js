import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import OpenAI from 'openai';
import { fetchActivityData, selectDuckPhoto, generateMemeImage, uploadMemeToStrava } from '../utils/memeHelpers';
import LoadingSpinner from './LoadingSpinner';
import './DuckMemeGenerator.css';
import { useSettings } from '../context/SettingsContext';
import { useMemes } from '../context/MemeContext';

const DuckMemeGenerator = () => {
  const [meme, setMeme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const { activityId } = useParams();
  const navigate = useNavigate();
  const { autoUploadToStrava } = useSettings();
  const { addMeme } = useMemes();

  const openai = new OpenAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
  });

  const generateMeme = async () => {
    setLoading(true);
    setError(null);
    try {
      const activityData = await fetchActivityData(activityId);
      const completion = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a witty meme generator that creates funny, sarcastic, and trending captions for duck photos based on workout data."
          },
          {
            role: "user",
            content: `Create a funny, sarcastic meme caption for a duck photo based on this workout data: 
              Distance: ${activityData.distance}km, 
              Time: ${activityData.time}, 
              Type: ${activityData.type}`
          }
        ],
        model: "gpt-3.5-turbo",
      });
      const memeText = completion.choices[0].message.content;
      const duckPhoto = await selectDuckPhoto(activityData, openai);
      const memeUrl = await generateMemeImage(duckPhoto, memeText);
      
      setMeme(memeUrl);
      addMeme(activityId, memeUrl);

      if (autoUploadToStrava) {
        try {
          await uploadMemeToStrava(memeUrl, activityId);
          setUploadStatus('success');
        } catch (uploadError) {
          console.error('Upload failed:', uploadError);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateMeme();
  }, []);

  return (
    <div className="meme-container">
      {loading ? (
        <LoadingSpinner />
      ) : meme ? (
        <>
          <img src={meme} alt="Generated duck meme" />
          {autoUploadToStrava && uploadStatus === 'success' && (
            <p className="upload-status success">Uploaded to Strava</p>
          )}
          <div className="button-group">
            <button onClick={generateMeme} className="generate-button">
              Generate Another Meme
            </button>
            <button onClick={() => navigate('/dashboard')} className="back-button">
              Back to Dashboard
            </button>
          </div>
        </>
      ) : (
        <div className="error-container">
          <p>Failed to generate meme</p>
          {error && <p className="error-message">{error}</p>}
          <div className="button-group">
            <button onClick={generateMeme} className="generate-button">
              Try Again
            </button>
            <button onClick={() => navigate('/dashboard')} className="back-button">
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DuckMemeGenerator;
