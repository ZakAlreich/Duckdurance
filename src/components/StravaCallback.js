import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const StravaCallback = () => {
  const [status, setStatus] = useState('Processing...');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const scope = urlParams.get('scope');
        
        console.log('🔑 Auth callback received:', {
          code: code?.substring(0, 10) + '...',
          scope,
          allParams: Object.fromEntries(urlParams)
        });

        if (!code) {
          throw new Error('No authorization code received');
        }

        // Token exchange request
        const tokenData = {
          client_id: process.env.REACT_APP_STRAVA_CLIENT_ID,
          client_secret: process.env.REACT_APP_STRAVA_CLIENT_SECRET,
          code: code,
          grant_type: 'authorization_code'
        };

        const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tokenData)
        });

        const data = await tokenResponse.json();

        if (!tokenResponse.ok) {
          console.error('❌ Token exchange failed:', data);
          throw new Error(data.message || 'Token exchange failed');
        }

        // Parse scopes from the URL-encoded string
        const scopes = scope ? scope.split(',') : [];
        console.log('📝 Received scopes:', scopes);

        // Store tokens and parsed scopes
        localStorage.setItem('strava_access_token', data.access_token);
        localStorage.setItem('strava_refresh_token', data.refresh_token);
        localStorage.setItem('strava_token_expiry', data.expires_at);
        localStorage.setItem('strava_scopes', JSON.stringify(scopes)); // Store as JSON

        console.log('✅ Token exchange successful:', {
          access_token: data.access_token?.substring(0, 10) + '...',
          token_type: data.token_type,
          expires_at: new Date(data.expires_at * 1000).toLocaleString(),
          scopes: scopes
        });

        // Redirect to dashboard
        navigate('/dashboard');
      } catch (error) {
        console.error('❌ Error in callback:', error);
        navigate('/');
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
