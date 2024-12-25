import React from 'react';

const StravaAuth = () => {
  const handleAuth = () => {
    try {
      const clientId = process.env.REACT_APP_STRAVA_CLIENT_ID;
      const redirectUri = encodeURIComponent(process.env.REACT_APP_REDIRECT_URI);
      
      // More detailed debug logging
      console.log('Environment variables:', {
        REACT_APP_STRAVA_CLIENT_ID: process.env.REACT_APP_STRAVA_CLIENT_ID,
        REACT_APP_REDIRECT_URI: process.env.REACT_APP_REDIRECT_URI
      });
      
      if (!clientId) {
        alert('Configuration error: Missing Strava client ID');
        return;
      }

      const scope = 'read,activity:read_all';
      const responseType = 'code';

      const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}&approval_prompt=force`;
      
      console.log('Full auth URL:', authUrl);
      window.location.href = authUrl;
    } catch (error) {
      console.error('Auth error:', error);
      alert('Failed to initialize Strava authentication');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-center">Connect with Strava</h2>
        <p className="mb-6 text-gray-600 text-center">
          Connect your Strava account to track and analyze your activities
        </p>
        <button
          onClick={handleAuth}
          className="w-full bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
        >
          Connect with Strava
        </button>
      </div>
    </div>
  );
};

export default StravaAuth;