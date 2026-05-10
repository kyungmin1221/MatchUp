import { Navigate, useLocation } from 'react-router-dom';
import { useAuthLoading, useUser } from '@/features/auth/hooks';
import { useIsAdmin } from '@/features/admin/hooks';

export default function AdminRoute({ children }) {
  const user = useUser();
  const loading = useAuthLoading();
  const isAdmin = useIsAdmin(user?.uid);
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center text-muted-foreground">
        불러오는 중…
      </div>
    );
  }
  if (!user) return <Navigate to="/" state={{ from: location }} replace />;
  if (!isAdmin) return <Navigate to="/groups" replace />;
  return children;
}
