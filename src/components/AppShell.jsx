import { Link, useNavigate } from 'react-router-dom';
import { LogOut, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { useUser } from '@/features/auth/hooks';
import { useIsAdmin } from '@/features/admin/hooks';
import { signOut } from '@/features/auth/api';

export default function AppShell({ children }) {
  const user = useUser();
  const navigate = useNavigate();
  const isAdmin = useIsAdmin(user?.uid);

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const handleHardRefresh = async () => {
    if (typeof window.__matchupHardRefresh === 'function') {
      await window.__matchupHardRefresh();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur safe-top">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/groups" className="font-semibold tracking-tight">
            MatchLink
          </Link>
          {user && (
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Link to="/admin" aria-label="관리자">
                  <Button variant="ghost" size="icon">
                    <ShieldCheck className="h-4 w-4" />
                  </Button>
                </Link>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleHardRefresh}
                aria-label="강제 새로고침"
                title="새 버전이 안 보이면 눌러주세요"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Avatar src={user.photoURL} name={user.displayName} size={28} />
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {user.displayName}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                aria-label="로그아웃"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </header>
      <main className="flex-1 container pt-6 safe-bottom">{children}</main>
    </div>
  );
}
