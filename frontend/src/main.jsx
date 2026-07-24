import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { ShoppingProvider } from './context/ShoppingContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ShoppingProvider>
        <App />
      </ShoppingProvider>
    </BrowserRouter>
  </StrictMode>,
)
