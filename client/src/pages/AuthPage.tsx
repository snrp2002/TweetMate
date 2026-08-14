import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Auth from '../components/Auth/Auth';
import Container from '../components/UI/Container';
import { useAuth } from '../auth/AuthContext';

export default function AuthPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) void navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  return (
    <Container>
      <Auth />
    </Container>
  );
}
