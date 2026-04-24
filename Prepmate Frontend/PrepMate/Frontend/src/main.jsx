import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/authContext';
import { TimerProvider } from './context/TimerContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <ThemeProvider>
        <TimerProvider>
          <App />
        </TimerProvider>
      </ThemeProvider>
    </AuthProvider>
  </BrowserRouter>
);
