import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from 'next-themes'
import DevErrorBoundary from './components/DevErrorBoundary'

createRoot(document.getElementById("root")!).render(
  <DevErrorBoundary>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <App />
    </ThemeProvider>
  </DevErrorBoundary>
);
