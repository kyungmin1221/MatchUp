import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Check, Undo2, Trash2 } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAllFeedback } from '@/features/feedback/hooks';
import { setFeedbackResolved, deleteFeedback } from '@/features/feedback/api';
import { formatDateTime } from '@/lib/utils';

const PROVIDER_LABEL = { google: 'Google', kakao: '카카오' };
const CATEGORY_LABEL = { bug: '🐛 버그', idea: '💡 개선 제안', other: '💬 기타' };

const TABS = [
  { value: 'open', label: '미처리' },
  { value: 'resolved', label: '처리됨' },
  { value: 'all', label: '전체' }
];

export default function AdminFeedback() {
  const { items, loading, error } = useAllFeedback();
  const [tab, setTab] = useState('open');

  const filtered = useMemo(() => {
    if (tab === 'open') return items.filter((f) => !f.resolved);
    if (tab === 'resolved') return items.filter((f) => f.resolved);
    return items;
  }, [items, tab]);

  const counts = useMemo(
    () => ({
      open: items.filter((f) => !f.resolved).length,
      resolved: items.filter((f) => f.resolved).length,
      all: items.length
    }),
    [items]
  );

  const handleToggleResolved = async (f) => {
    try {
      await setFeedbackResolved({ feedbackId: f.id, resolved: !f.resolved });
    } catch (e) {
      alert(e.message ?? '실패했어요.');
    }
  };

  const handleDelete = async (f) => {
    if (!confirm('이 피드백을 삭제할까요? 되돌릴 수 없어요.')) return;
    try {
      await deleteFeedback({ feedbackId: f.id });
    } catch (e) {
      alert(e.message ?? '삭제에 실패했어요.');
    }
  };

  return (
    <AppShell>
      <div className="mb-4">
        <Link
          to="/admin"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> 가입자 관리
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <MessageSquare className="h-6 w-6" /> 피드백
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          사용자가 보낸 의견 · 총 {items.length}건
        </p>
      </div>

      <div className="mb-4 inline-flex rounded-md bg-secondary p-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={
              tab === t.value
                ? 'rounded-sm bg-background px-3 py-1 text-sm font-semibold shadow-[0_1px_2px_rgba(15,23,42,0.08)]'
                : 'rounded-sm px-3 py-1 text-sm text-muted-foreground'
            }
          >
            {t.label} <span className="ml-1 text-xs">{counts[t.value]}</span>
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          불러오기 실패: {error.message}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {tab === 'open'
              ? '미처리 피드백이 없어요.'
              : tab === 'resolved'
              ? '처리한 피드백이 없어요.'
              : '아직 피드백이 없어요.'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((f) => {
            const provider = f.provider ?? (f.authorUid?.startsWith('kakao:') ? 'kakao' : 'google');
            return (
              <Card key={f.id} className={f.resolved ? 'opacity-70' : ''}>
                <CardContent className="space-y-3 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <Avatar name={f.authorName} size={32} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-medium">{f.authorName ?? '익명'}</p>
                          <Badge variant={provider === 'kakao' ? 'default' : 'outline'}>
                            {PROVIDER_LABEL[provider] ?? provider}
                          </Badge>
                          <Badge variant="outline">{CATEGORY_LABEL[f.category] ?? f.category}</Badge>
                          {f.resolved && (
                            <Badge className="bg-emerald-100 text-emerald-900 hover:bg-emerald-100">
                              처리됨
                            </Badge>
                          )}
                        </div>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {f.createdAt ? formatDateTime(f.createdAt) : '-'}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleResolved(f)}
                        aria-label={f.resolved ? '미처리로 되돌리기' : '처리 완료'}
                      >
                        {f.resolved ? (
                          <>
                            <Undo2 className="mr-1 h-3.5 w-3.5" />
                            되돌리기
                          </>
                        ) : (
                          <>
                            <Check className="mr-1 h-3.5 w-3.5" />
                            처리됨
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(f)}
                        aria-label="삭제"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {f.text}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
