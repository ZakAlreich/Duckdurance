import { createCanvas, loadImage } from 'canvas';
import axios from 'axios';
import OpenAI from 'openai';

// Fetch activity data from Strava
export const fetchActivityData = async (activityId) => {
  try {
    const accessToken = localStorage.getItem('strava_access_token');
    
    const response = await axios.get(
      `https://www.strava.com/api/v3/activities/${activityId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    // Log raw Strava response for debugging
    console.log('Raw Strava Response:', response.data);

    return {
      distance: (response.data.distance / 1000).toFixed(2), // Convert to km
      time: formatTime(response.data.moving_time || 0),
      type: response.data.type || 'Unknown',
      averageSpeed: response.data.average_speed 
        ? (response.data.average_speed * 3.6).toFixed(1) // Convert m/s to km/h
        : 0,
      elevationGain: Math.round(response.data.total_elevation_gain || 0),
      description: response.data.description || ''
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
          content: `Based on this workout data and description, what would be the most appropriate emotional state?
            Distance: ${activity.distance}km
            Time: ${activity.time}
            Type: ${activity.type}
            Elevation Gain: ${activity.elevationGain}m
            Average Speed: ${activity.averageSpeed}km/h
            Activity Description: ${activity.description || 'No description provided'}`
        }
      ],
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      max_tokens: 10
    });

    const mood = completion.choices[0].message.content.toLowerCase().trim();
    console.log('Selected mood:', mood);
    const selectedPhoto = duckPhotos[mood] || duckPhotos.default;
    
    // Verify image exists
    const imageExists = await verifyImagePath(selectedPhoto);
    if (!imageExists) {
      console.warn('⚠️ Selected image not found, falling back to default');
      return duckPhotos.default;
    }
    
    console.log('Selected photo path:', selectedPhoto);
    return selectedPhoto;
  } catch (error) {
    console.error('Error selecting duck photo:', error);
    return duckPhotos.default;
  }
};

// Generate meme by combining photo and text
export const generateMemeImage = async (imagePath, text, activity) => {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Load the image
    const image = new Image();
    image.crossOrigin = 'anonymous';
    
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
      image.src = imagePath;
    });

    // Set canvas size to match image
    canvas.width = image.width;
    canvas.height = image.height;

    // Draw the image
    ctx.drawImage(image, 0, 0);

    // Add stats text with better contrast
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'black';

    // Stats with outline for better readability
    const stats = [
      `${getActivityEmoji(activity.type)} ${activity.type}`,
      `📏 ${activity.distance}km`,
      `⏱️ ${activity.time}`,
      `⚡ ${activity.averageSpeed}km/h`
    ];
    
    stats.forEach((stat, index) => {
      const y = 20 + (index * 20);
      ctx.strokeText(stat, 15, y);
      ctx.fillText(stat, 15, y);
    });

    // Add main meme text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 36px Impact';  // Increased size for better readability
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;  // Thicker outline
    
    // Break text into lines with better word wrapping
    const words = text.split(' ');
    let lines = [];
    let currentLine = words[0];
    const maxWidth = canvas.width - 60;  // Better margin

    for (let i = 1; i < words.length; i++) {
      const testLine = currentLine + ' ' + words[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);

    // Draw text lines with better positioning
    const lineHeight = 40;  // Increased line height
    const totalTextHeight = lineHeight * lines.length;
    let y = canvas.height - totalTextHeight - 30;  // More bottom margin

    lines.forEach(line => {
      ctx.strokeText(line, canvas.width / 2, y);
      ctx.fillText(line, canvas.width / 2, y);
      y += lineHeight;
    });

    // Add Strava attribution with better contrast
    ctx.font = '14px Arial';
    ctx.textAlign = 'right';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'black';
    ctx.strokeText('Stats from Strava', canvas.width - 10, canvas.height - 10);
    ctx.fillStyle = '#FC4C02';  // Strava orange
    ctx.fillText('Stats from Strava', canvas.width - 10, canvas.height - 10);

    return canvas.toDataURL('image/jpeg', 0.95);  // Increased quality
  } catch (error) {
    console.error('Error generating meme:', error);
    throw error;
  }
};

// Helper function to format time
const formatTime = (seconds) => {
  if (!seconds) return '0h 0m 0s';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${hours}h ${minutes}m ${secs}s`;
};

// Add this debug function
const logActivityData = (activity, stage) => {
  console.log(`\n=== Activity Data at ${stage} ===`);
  console.log('Raw activity object:', activity);
  console.log('Individual fields:');
  console.log('Distance:', activity.distance, 'km');
  console.log('Time:', activity.time);
  console.log('Type:', activity.type);
  console.log('Elevation Gain:', activity.elevationGain, 'm');
  console.log('Average Speed:', activity.averageSpeed, 'km/h');
  console.log('Description:', activity.description);
  console.log('========================\n');
};

export const generateMemeForActivity = async (activity) => {
  const openai = new OpenAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
  });

  try {
    console.log('Raw activity data received:', activity);

    // Format the activity data properly using the raw values
    const formattedActivity = {
      // Check if distance needs conversion from meters to km
      distance: activity.distance >= 100 
        ? (activity.distance / 1000).toFixed(2)  // Convert from meters
        : Number(activity.distance).toFixed(2),   // Already in km, just format
      time: formatTime(activity.moving_time),
      type: activity.sport_type || activity.type || 'Unknown',
      elevationGain: Math.round(activity.total_elevation_gain || 0),
      averageSpeed: activity.average_speed ? (activity.average_speed * 3.6).toFixed(1) : 0,
      description: activity.name || 'No description'
    };

    // Log formatted activity data
    logActivityData(formattedActivity, 'After Formatting');

    // Generate meme text
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a witty meme generator that creates funny, sarcastic, and trending captions for duck photos based on workout data. Feel free to round or approximate the numbers from the workout data to make the caption flow better. Consider any weather conditions, feelings, or context from the activity description."
        },
        {
          role: "user",
          content: `Create a funny, sarcastic meme caption for a duck photo based on this workout data: 
            Distance: ${formattedActivity.distance}km
            Time: ${formattedActivity.time}
            Type: ${formattedActivity.type}
            Elevation Gain: ${formattedActivity.elevationGain}m
            Average Speed: ${formattedActivity.averageSpeed}km/h
            Activity Description: ${formattedActivity.description}`
        }
      ],
      model: "gpt-3.5-turbo",
      temperature: 0.8,
      max_tokens: 60
    });

    const memeText = completion.choices[0].message.content;
    console.log('Generated Meme Text:', memeText);

    // Select duck photo using the properly formatted data
    const duckPhoto = await selectDuckPhoto(formattedActivity, openai);
    console.log('Selected Duck Photo:', duckPhoto);

    // Generate final meme
    const memeUrl = await generateMemeImage(duckPhoto, memeText, formattedActivity);
    
    // Add explicit upload attempt with logging
    console.log('Checking activity ID for Strava upload:', activity.id);
    if (activity.id) {
      try {
        console.log('Starting Strava upload process...');
        await uploadMemeToStrava(memeUrl, activity.id);
        console.log('✅ Successfully uploaded meme to Strava activity:', activity.id);
      } catch (uploadError) {
        console.error('❌ Strava upload failed:', uploadError);
      }
    } else {
      console.warn('⚠️ No activity ID found, skipping Strava upload');
    }

    return memeUrl;
  } catch (error) {
    console.error('Error in meme generation process:', error);
    throw error;
  }
};

// Add this new function to check scopes
const checkStravaScopes = async () => {
  try {
    const accessToken = localStorage.getItem('strava_access_token');
    if (!accessToken) {
      console.error('❌ No access token found');
      return null;
    }

    const response = await fetch('https://www.strava.com/api/v3/athlete', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch athlete data');
    }

    const data = await response.json();
    
    // Log the full token info
    console.log('🔑 Token Permissions:', {
      token: accessToken.substring(0, 10) + '...',
      scopes: data.scopes || 'No scopes found',
    });

    return data.scopes;
  } catch (error) {
    console.error('❌ Error checking Strava scopes:', error);
    return null;
  }
};

// Modify your upload function to check scopes first
export const uploadMemeToStrava = async (memeUrl, activityId) => {
  try {
    // Check scopes before attempting upload
    console.log('Checking Strava permissions...');
    const scopes = await checkStravaScopes();
    
    if (!scopes || !scopes.includes('activity:write')) {
      console.error('❌ Missing required write permission!');
      console.log('Current scopes:', scopes);
      throw new Error('Missing required write permission. Please re-authenticate.');
    }
    console.log('✅ Have write permission');

    console.log('Starting Strava upload with:', { activityId });
    
    const accessToken = localStorage.getItem('strava_access_token');
    if (!accessToken) {
      console.error('❌ No Strava access token found in localStorage');
      throw new Error('No Strava access token found');
    }
    console.log('✅ Found Strava access token');

    // First verify the activity exists
    console.log('Verifying activity exists...');
    const activityResponse = await fetch(
      `https://www.strava.com/api/v3/activities/${activityId}`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );

    if (!activityResponse.ok) {
      console.error('❌ Activity not found or not accessible');
      throw new Error('Activity not found or not accessible');
    }
    console.log('✅ Activity verified');

    // Convert the canvas data URL to a Blob
    console.log('Converting meme to blob...');
    const response = await fetch(memeUrl);
    const blob = await response.blob();
    console.log('✅ Converted meme to blob:', blob.size, 'bytes');
    
    // Create FormData object
    const formData = new FormData();
    formData.append('file', blob, 'duck_meme.jpg');
    
    // Use the correct endpoint for photo uploads
    const uploadUrl = `https://www.strava.com/api/v3/uploads`;
    
    console.log('Sending upload request to Strava API...');
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: formData
    });

    console.log('Upload response status:', uploadResponse.status);
    const responseText = await uploadResponse.text();
    console.log('Upload response text:', responseText);

    if (!uploadResponse.ok) {
      console.error('❌ Upload failed with status:', uploadResponse.status);
      throw new Error(`Strava upload failed: ${responseText}`);
    }

    console.log('✅ Strava upload successful');
    return responseText ? JSON.parse(responseText) : null;
  } catch (error) {
    console.error('❌ Error in uploadMemeToStrava:', error);
    throw error;
  }
};

// Update the image path to use the correct public URL
const getImagePath = (photoPath) => {
  // Remove /archive/Duck/test/ from the path
  const filename = photoPath.split('/').pop();
  return `/images/${filename}`; // Assuming images are in public/images/
};

const verifyImagePath = async (path) => {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      console.error(`❌ Image not found at ${path}`, response.status);
      return false;
    }
    console.log(`✅ Image verified at ${path}`);
    return true;
  } catch (error) {
    console.error(`❌ Error checking image at ${path}:`, error);
    return false;
  }
};

// Add this new function to get activity emoji
const getActivityEmoji = (activityType) => {
  const emojiMap = {
    'Run': '🏃',
    'Ride': '🚴',
    'Swim': '🏊',
    'Walk': '🚶',
    'Hike': '🥾',
    'Workout': '💪',
    'WeightTraining': '🏋️',
    'Yoga': '🧘',
    'CrossFit': '🏋️‍♂️',
    'Rowing': '🚣',
    // Add more activity types as needed
  };
  return emojiMap[activityType] || '🏃'; // Default to running emoji
};
