import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/authContext';
import { TimerProvider } from './context/TimerContext';
import { HabitProvider } from './context/HabitContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <ThemeProvider>
        <TimerProvider>
          <HabitProvider>
            <App />
          </HabitProvider>
        </TimerProvider>
      </ThemeProvider>
    </AuthProvider>
  </BrowserRouter>
);
