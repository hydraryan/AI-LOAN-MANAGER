import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { ThemeProvider } from './context/ThemeContext'
import { MockDataProvider } from './context/MockDataContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <MockDataProvider>
        <App />
      </MockDataProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
