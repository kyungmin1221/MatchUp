import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { Avatar } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAllUsers } from '@/features/admin/hooks';
import { formatDateTime } from '@/lib/utils';

const PROVIDER_LABEL = {
  google: 'Google',
  kakao: '카카오'
};

export default function Admin() {
  const { data: users = [], isLoading, error } = useAllUsers();

  return (
    <AppShell>
      <div className="mb-4">
        <Link
          to="/groups"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> 내 그룹
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <ShieldCheck className="h-6 w-6" /> 가입자 관리
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          MatchUp 에 로그인한 모든 사용자 · 총 {users.length}명
        </p>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          불러오기 실패: {error.message}
        </p>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-muted-foreground">아직 가입자가 없어요.</p>
      ) : (
        <div className="space-y-2">
          {users.map((u) => {
            const provider = u.provider || (u.id?.startsWith('kakao:') ? 'kakao' : 'google');
            return (
              <Card key={u.id}>
                <CardContent className="flex items-center gap-3 py-3">
                  <Avatar src={u.photoURL} name={u.displayName} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{u.displayName ?? '익명'}</p>
                      <Badge variant={provider === 'kakao' ? 'default' : 'outline'}>
                        {PROVIDER_LABEL[provider] ?? provider}
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {u.createdAt ? formatDateTime(u.createdAt) : '-'} · uid {u.id.slice(0, 12)}…
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
