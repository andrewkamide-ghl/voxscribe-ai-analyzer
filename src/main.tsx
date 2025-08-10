import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from 'next-themes'
import DevErrorBoundary from './components/DevErrorBoundary'

// Surface runtime errors early in Lovable preview
window.addEventListener('error', (event) => {
  // eslint-disable-next-line no-console
  console.error('[preview] window error:', event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  // eslint-disable-next-line no-console
  console.error('[preview] unhandled promise rejection:', event.reason);
});

// eslint-disable-next-line no-console
console.info('[preview] Bootstrapping app...');

createRoot(document.getElementById("root")!).render(
  <DevErrorBoundary>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <App />
    </ThemeProvider>
  </DevErrorBoundary>
);
