import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GoogleAuthProvider } from './contexts/GoogleAuthContext';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {googleClientId ? (
      <GoogleOAuthProvider clientId={googleClientId}>
        <GoogleAuthProvider>
          <App />
        </GoogleAuthProvider>
      </GoogleOAuthProvider>
    ) : (
      <GoogleAuthProvider>
        <App />
      </GoogleAuthProvider>
    )}
  </React.StrictMode>
);
