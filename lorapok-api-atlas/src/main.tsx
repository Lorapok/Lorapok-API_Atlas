import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Hide the pre-render SEO content once React has mounted
const preRender = document.getElementById('pre-render')
if (preRender) preRender.style.display = 'none'
