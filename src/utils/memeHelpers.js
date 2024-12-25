import { createCanvas, loadImage } from 'canvas';
import axios from 'axios';
import OpenAI from 'openai';

// Fetch activity data from Strava
export const fetchActivityData = async (activityId) => {
  try {
    // Get access token from your storage/context
    const accessToken = localStorage.getItem('strava_access_token');
    
    const response = await axios.get(
      `https://www.strava.com/api/v3/activities/${activityId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    return {
      distance: (response.data.distance / 1000).toFixed(2), // Convert to km
      time: formatTime(response.data.moving_time),
      type: response.data.type,
      averageSpeed: response.data.average_speed,
      elevationGain: response.data.total_elevation_gain
    };
  } catch (error) {
    console.error('Error fetching activity:', error);
    throw error;
  }
};

// Select appropriate duck photo based on activity metrics
export const selectDuckPhoto = async (activity, openai) => {
  const duckPhotos = {
    tired: '/archive/Duck/test/images/duck23.jpeg',
    excited: '/archive/Duck/test/images/duck87.jpeg',
    proud: '/archive/Duck/test/images/duck88.jpeg',
    energetic: '/archive/Duck/test/images/duck89.jpeg',
    default: '/archive/Duck/test/images/duck76.jpeg'
  };

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert at analyzing workout data and determining the appropriate emotional state. You should respond with ONLY ONE of these words: tired, excited, proud, energetic, or default."
        },
        {
          role: "user",
          content: `Based on this workout data, what would be the most appropriate emotional state?
            Distance: ${activity.distance}km
            Time: ${activity.time}
            Type: ${activity.type}
            Elevation Gain: ${activity.elevationGain}m
            Average Speed: ${activity.averageSpeed}km/h`
        }
      ],
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      max_tokens: 10
    });

    const mood = completion.choices[0].message.content.toLowerCase().trim();
    console.log('Selected mood:', mood);
    console.log('Selected photo path:', duckPhotos[mood] || duckPhotos.default);

    return duckPhotos[mood] || duckPhotos.default;
  } catch (error) {
    console.error('Error selecting duck photo:', error);
    return duckPhotos.default;
  }
};

// Generate meme by combining photo and text
export const generateMemeImage = async (imagePath, text) => {
  try {
    // Load the image
    const image = await loadImage(imagePath);
    
    // Create canvas with image dimensions
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    
    // Draw image
    ctx.drawImage(image, 0, 0);
    
    // Configure text style
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 5;
    ctx.textAlign = 'center';
    ctx.font = '48px Impact';
    
    // Split text into multiple lines if needed
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + " " + word).width;
      if (width < image.width - 20) {
        currentLine += " " + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);

    // Draw text
    const lineHeight = 60;
    const totalHeight = lineHeight * lines.length;
    const startY = image.height - totalHeight - 20;

    lines.forEach((line, index) => {
      const y = startY + (index * lineHeight);
      ctx.strokeText(line, image.width / 2, y);
      ctx.fillText(line, image.width / 2, y);
    });

    // Convert canvas to data URL
    return canvas.toDataURL('image/jpeg');
  } catch (error) {
    console.error('Error generating meme:', error);
    throw error;
  }
};

// Helper function to format time
const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${hours}h ${minutes}m ${secs}s`;
};

export const generateMemeForActivity = async (activity) => {
  const openai = new OpenAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
  });

  try {
    // Generate meme text
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a witty meme generator that creates funny, sarcastic, and trending captions for duck photos based on workout data."
        },
        {
          role: "user",
          content: `Create a funny, sarcastic meme caption for a duck photo based on this workout data: 
            Distance: ${activity.distance}km
            Time: ${activity.time}
            Type: ${activity.type}
            Elevation Gain: ${activity.elevationGain}m
            Average Speed: ${activity.averageSpeed}km/h`
        }
      ],
      model: "gpt-3.5-turbo",
      temperature: 0.8,
      max_tokens: 60
    });
    const memeText = completion.choices[0].message.content;

    // Select duck photo
    const duckPhoto = await selectDuckPhoto(activity, openai);

    // Generate final meme
    const memeUrl = await generateMemeImage(duckPhoto, memeText);
    return memeUrl;

  } catch (error) {
    console.error('Error generating meme:', error);
    throw error;
  }
};

export const uploadMemeToStrava = async (memeUrl, activityId) => {
  try {
    const accessToken = localStorage.getItem('strava_access_token');
    
    // First convert the canvas data URL to a Blob
    const response = await fetch(memeUrl);
    const blob = await response.blob();
    
    // Create FormData object
    const formData = new FormData();
    formData.append('file', blob, 'duck_meme.jpg');
    formData.append('activity_id', activityId);

    // Upload to Strava
    const uploadResponse = await fetch('https://www.strava.com/api/v3/uploads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: formData
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload to Strava');
    }

    const result = await uploadResponse.json();
    console.log('Upload successful:', result);
    return result;
  } catch (error) {
    console.error('Error uploading to Strava:', error);
    throw error;
  }
};
