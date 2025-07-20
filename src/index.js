import React from 'react';
import ReactDOM from 'react-dom/client'; // Use createRoot for React 18+
import './index.css'; // This is now present and should resolve
import App from './App';
// import reportWebVitals from './reportWebVitals'; // Removed this import

// Create a root to render your React application
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CVA-vitals
// reportWebVitals(); // Removed this function call
