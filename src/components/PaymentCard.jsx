import { Wallet, Pencil, Copy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { buildTossLink, computePerPerson, formatWon } from '@/features/match/payment';

// 회비 카드 — 매치 상세에 표시.
// - payment 없음 + isOwner → "회비 설정" CTA
// - payment 있음 + isOwner → 총액/1인당/수정 버튼 (본인은 수신자라 송금 버튼 없음)
// - payment 있음 + 다른 참가자 → 1인당 + "토스로 송금" 버튼
// - payment 없음 + 다른 참가자 → 표시 안 함 (null 반환)
export default function PaymentCard({
  payment,
  isOwner,
  isParticipant,
  splitCount,
  matchTitle,
  onEdit
}) {
  if (!payment && !isOwner) return null;

  if (!payment && isOwner) {
    return (
      <Card>
        <CardContent className="flex items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wallet className="h-4 w-4" />
            <span>구장 대여비를 입력하면 1/N 정산이 자동 계산돼요.</span>
          </div>
          <Button size="sm" variant="outline" onClick={onEdit}>
            회비 설정
          </Button>
        </CardContent>
      </Card>
    );
  }

  const perPerson = computePerPerson(payment.totalCost, splitCount);
  const memo = payment.memo || matchTitle || 'MatchUp 회비';

  const tossLink = buildTossLink({
    bank: payment.bank,
    accountNo: payment.accountNo,
    amount: perPerson,
    memo
  });

  const copyAccount = async () => {
    const text = `${payment.bank} ${payment.accountNo} (${payment.holderName})`;
    try {
      await navigator.clipboard.writeText(text);
      alert('계좌 정보를 복사했어요.');
    } catch {
      /* ignore */
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="h-4 w-4" />
            회비 정산
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline">1/N</Badge>
            {isOwner && (
              <Button size="sm" variant="ghost" onClick={onEdit} aria-label="회비 수정">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs text-muted-foreground">총 {formatWon(payment.totalCost)} · {splitCount}명</span>
          <span className="text-2xl font-extrabold tracking-tight text-foreground">
            {formatWon(perPerson)}
            <span className="ml-1 text-xs font-medium text-muted-foreground">/ 1인</span>
          </span>
        </div>

        <div className="rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="font-semibold">
                {payment.bank} · {payment.holderName}
              </div>
              <div className="truncate font-mono text-xs text-muted-foreground">
                {payment.accountNo}
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={copyAccount} aria-label="계좌 복사">
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {!isOwner && isParticipant && (
          <a
            href={tossLink}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-md font-bold text-[#191919] transition active:opacity-90"
            style={{ background: '#3182F6', color: '#fff' }}
          >
            토스로 {formatWon(perPerson)} 송금
          </a>
        )}
        {isOwner && (
          <p className="text-xs text-muted-foreground">
            본인이 받는 사람이라 송금 버튼은 표시되지 않아요. 다른 참가자가 보면 1인 분 토스 송금 버튼이 떠요.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
