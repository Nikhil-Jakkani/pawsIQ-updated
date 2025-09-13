import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'

// Simple error boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          margin: '20px', 
          backgroundColor: '#ffebee', 
          border: '1px solid #f44336',
          borderRadius: '4px'
        }}>
          <h2>Something went wrong.</h2>
          <p>{this.state.error && this.state.error.toString()}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Function to hide loading screen
const hideLoadingScreen = () => {
  const loadingElement = document.getElementById('loading');
  if (loadingElement && loadingElement.style.display !== 'none') {
    console.log('Hiding loading screen...');
    // Add fade-out effect
    loadingElement.style.opacity = '0';
    loadingElement.style.transition = 'opacity 0.3s ease-out';
    
    // Remove element after transition
    setTimeout(() => {
      if (loadingElement) {
        loadingElement.style.display = 'none';
        console.log('Loading screen hidden');
      }
    }, 300);
  }
};

// Direct rendering
try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  // Create root
  const root = ReactDOM.createRoot(rootElement);
  
  // Render the app with proper routing
  const AppTree = (
    <Router>
      <ErrorBoundary>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ErrorBoundary>
    </Router>
  );

  // In development, avoid StrictMode to prevent double effects (duplicate API calls)
  const withStrict = import.meta?.env?.MODE === 'production';
  root.render(withStrict ? <React.StrictMode>{AppTree}</React.StrictMode> : AppTree);
  
  // Hide loading screen after React has started rendering
  setTimeout(hideLoadingScreen, 800);
  
} catch (error) {
  console.error("Error rendering app:", error);
  
  // Hide loading screen
  hideLoadingScreen();
  
  // Show error message
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; color: #721c24; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px;">
        <h2>Failed to load application</h2>
        <p>Error: ${error.message}</p>
        <button 
          onclick="window.location.reload()" 
          style="padding: 8px 16px; background-color: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 10px;"
        >
          Refresh Page
        </button>
      </div>
    `;
  }
}
