import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMemes } from '../context/MemeContext';
import { generateMemeForActivity } from '../utils/memeHelpers';

const Dashboard = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { generatedMemes, addMeme } = useMemes();
  const [generatingMemes, setGeneratingMemes] = useState({});

  const getDuckMotivation = (activity) => {
    const speed = (activity.distance / activity.moving_time) * 3.6; // km/h
    const distance = activity.distance / 1000; // km

    // Fun duck-themed motivational messages based on performance
    if (speed > 20) {
      return {
        message: "ZOOM ZOOM! You're faster than a duck being chased by a bread truck! 🦆💨",
        memeText: "Speed demon duck approves!"
      };
    } else if (distance > 10) {
      return {
        message: "Look at you go! Even mother duck is proud of this long journey! 🦆👏",
        memeText: "Long distance duck salutes you!"
      };
    } else if (activity.total_elevation_gain > 100) {
      return {
        message: "Hills? More like THRILLS! You're climbing higher than a duck in an elevator! 🦆⛰️",
        memeText: "Mountain duck energy!"
      };
    } else {
      return {
        message: "Remember: Even a duck paddles like crazy under the surface! Keep going! 🦆💪",
        memeText: "Determined duck believes in you!"
      };
    }
  };

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const accessToken = localStorage.getItem('strava_access_token');
        
        if (!accessToken) {
          navigate('/');
          return;
        }

        const response = await fetch('https://www.strava.com/api/v3/athlete/activities', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (!response.ok) throw new Error('Failed to fetch activities');
        
        const data = await response.json();
        setActivities(data);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [navigate]);

  useEffect(() => {
    const autoGenerateMemeForLatestActivity = async () => {
      if (activities && activities.length > 0) {
        const sortedActivities = [...activities].sort((a, b) => 
          new Date(b.date) - new Date(a.date)
        );
        
        const latestActivity = sortedActivities[0];
        
        if (latestActivity && !generatedMemes[latestActivity.id]) {
          try {
            const memeUrl = await generateMemeForActivity(latestActivity);
            addMeme(latestActivity.id, memeUrl);
          } catch (error) {
            console.error('Error auto-generating meme:', error);
          }
        }
      }
    };

    autoGenerateMemeForLatestActivity();
  }, [activities, addMeme, generatedMemes]);

  const handleGenerateMeme = async (activityId) => {
    try {
      // Set generating state
      setGeneratingMemes(prev => ({ ...prev, [activityId]: true }));

      // Find the activity
      const activity = activities.find(a => a.id === activityId);
      if (!activity) throw new Error('Activity not found');

      // Format distance properly before passing to meme generator
      const formattedDistance = (activity.distance / 1000).toFixed(2); // Convert to km and format to 2 decimal places
      const memeUrl = await generateMemeForActivity({
        ...activity,
        distance: formattedDistance // Pass formatted distance
      });
      addMeme(activityId, memeUrl);

    } catch (error) {
      console.error('Error generating meme:', error);
    } finally {
      setGeneratingMemes(prev => ({ ...prev, [activityId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p>🦆 Gathering duck-tastic data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">
        🦆 Duck-tivities Dashboard 🦆
      </h1>
      <div className="grid gap-6 max-w-4xl mx-auto">
        {activities.map(activity => {
          const duckMotivation = getDuckMotivation(activity);
          return (
            <div key={activity.id} className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-bold text-xl mb-2">{activity.name}</h2>
                  {activity.description && (
                    <div className="strava-description">
                      <p>{activity.description}</p>
                    </div>
                  )}
                  <div className="activity-stats">
                    <p>
                      <strong>Distance:</strong> {(activity.distance / 1000).toFixed(2)}km
                    </p>
                    <p>
                      <strong>Time:</strong> {formatTime(activity.moving_time)}
                    </p>
                    <p>
                      <strong>Elevation:</strong> {Math.round(activity.total_elevation_gain)}m
                    </p>
                    <p>
                      <strong>Avg Speed:</strong> {((activity.distance / 1000) / (activity.moving_time / 3600)).toFixed(1)}km/h
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-4xl">🦆</span>
                </div>
              </div>
              
              <div className="mt-4 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-lg font-medium text-yellow-800">
                  {duckMotivation.message}
                </p>
                <p className="text-sm text-yellow-600 mt-2 italic">
                  {duckMotivation.memeText}
                </p>
              </div>
              {generatedMemes[activity.id] && (
                <div className="generated-meme">
                  <img 
                    src={generatedMemes[activity.id]} 
                    alt="Generated meme"
                    className="activity-meme"
                  />
                </div>
              )}
              <button 
                onClick={() => handleGenerateMeme(activity.id)}
                className="meme-button"
                disabled={generatingMemes[activity.id]}
              >
                {generatingMemes[activity.id] ? 'Generating...' : 'Generate Duck Meme'}
              </button>
            </div>
          );
        })}
      </div>

      {activities.length === 0 && (
        <div className="text-center mt-10">
          <p className="text-xl">No activities yet? Don't worry!</p>
          <p className="text-2xl mt-4">🦆 Even ducks have to start somewhere! 🦆</p>
        </div>
      )}
    </div>
  );
};

// Helper function to format time
const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

export default Dashboard;