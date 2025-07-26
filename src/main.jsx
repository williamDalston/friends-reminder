import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'

console.log('main.jsx loading...');
console.log('React version:', React.version);
console.log('ReactDOM version:', ReactDOM.version);
console.log('Document ready state:', document.readyState);
console.log('Window location:', window.location.href);

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
    // Show error on page
    rootElement.innerHTML = `
      <div style="padding: 20px; color: red; font-family: Arial, sans-serif;">
        <h1>React Loading Error</h1>
        <p>Error: ${error.message}</p>
        <p>Stack: ${error.stack}</p>
        <button onclick="window.location.reload()">Reload Page</button>
      </div>
    `;
  }
} else {
  console.error('Root element not found!');
  // Try to create a fallback
  document.body.innerHTML = '<div id="root"><h1>Root element not found - this is a fallback</h1></div>';
}
