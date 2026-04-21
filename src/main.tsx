import { ClerkProvider } from '@clerk/clerk-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RealtimeProvider } from '@upstash/realtime/client';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import { appUrl, routerBasename } from './lib/appUrl';

const clerkPk = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const queryClient = new QueryClient();

const root = createRoot(document.getElementById('root')!);

const shell = (
  <QueryClientProvider client={queryClient}>
    <RealtimeProvider api={{ url: appUrl('/api/realtime'), withCredentials: true }}>
      <BrowserRouter basename={routerBasename()}>
        <App />
      </BrowserRouter>
    </RealtimeProvider>
  </QueryClientProvider>
);

if (clerkPk) {
  root.render(
    <StrictMode>
      <ClerkProvider publishableKey={clerkPk}>{shell}</ClerkProvider>
    </StrictMode>,
  );
} else {
  root.render(<StrictMode>{shell}</StrictMode>);
}
