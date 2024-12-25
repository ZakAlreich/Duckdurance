import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const StravaCallback = () => {
  const [status, setStatus] = useState('Processing...');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get('code');
      const error = params.get('error');
      
      if (error) {
        setStatus(`Authorization failed: ${error}`);
        setTimeout(() => navigate('/'), 3000);
        return;
      }

      if (!code) {
        setStatus('No authorization code received');
        setTimeout(() => navigate('/'), 2000);
        return;
      }

      try {
        const tokenUrl = 'https://www.strava.com/oauth/token';
        const tokenData = {
          client_id: process.env.REACT_APP_STRAVA_CLIENT_ID,
          client_secret: process.env.REACT_APP_STRAVA_CLIENT_SECRET,
          code: code,
          grant_type: 'authorization_code'
        };

        console.log('Sending token request with data:', tokenData); // Debug log

        const response = await fetch(tokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tokenData)
        });

        const data = await response.json();
        console.log('Token response:', data); // Debug log

        if (response.ok) {
          localStorage.setItem('strava_access_token', data.access_token);
          navigate('/dashboard');
        } else {
          throw new Error(data.message || 'Failed to get access token');
        }
      } catch (error) {
        console.error('Error details:', error);
        setStatus(`Authentication failed: ${error.message}`);
        setTimeout(() => navigate('/'), 3000);
      }
    };

    handleCallback();
  }, [navigate, location]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">{status}</h2>
        <div className="text-gray-600">
          {status.includes('failed') ? 
            'Redirecting back to login...' : 
            'Please wait while we connect your account...'}
        </div>
      </div>
    </div>
  );
};

export default StravaCallback;
