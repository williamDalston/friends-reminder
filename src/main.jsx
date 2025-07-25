import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'

console.log('main.jsx loading...');
console.log('React version:', React.version);
console.log('ReactDOM version:', ReactDOM.version);

const rootElement = document.getElementById('root');
console.log('Root element found:', rootElement);

if (rootElement) {
  try {
    console.log('Attempting to create React root...');
    const root = ReactDOM.createRoot(rootElement);
    console.log('React root created successfully');
    
    console.log('Attempting to render App...');
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
    console.log('App render called successfully');
  } catch (error) {
    console.error('Error during React initialization:', error);
  }
} else {
  console.error('Root element not found!');
  // Try to create a fallback
  document.body.innerHTML = '<div id="root"><h1>Root element not found - this is a fallback</h1></div>';
}
