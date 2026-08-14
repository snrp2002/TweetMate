import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { config } from './config';
import { AuthProvider } from './auth/AuthContext';
import { PostFormProvider } from './postForm/PostFormContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const container = document.getElementById('root');
if (!container) throw new Error('Root container #root is missing from index.html');

createRoot(container).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={config.googleClientId}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <PostFormProvider>
            <App />
          </PostFormProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
);
