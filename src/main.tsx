import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GoogleAuthProvider } from './contexts/GoogleAuthContext';
import App from './App';
import MathJaxProvider from './components/MathJaxProvider';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'placeholder';

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <GoogleAuthProvider>
        <MathJaxProvider>
          <App />
        </MathJaxProvider>
      </GoogleAuthProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
