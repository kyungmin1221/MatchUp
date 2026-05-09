import { Navigate, useLocation } from 'react-router-dom';
import { useAuthLoading, useUser } from '@/features/auth/hooks';

export default function ProtectedRoute({ children }) {
  const user = useUser();
  const loading = useAuthLoading();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center text-muted-foreground">
        불러오는 중…
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  return children;
}
