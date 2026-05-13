import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BANK_OPTIONS, getLastBankAccount, rememberBankAccount } from '@/features/match/payment';

// 회비 설정 다이얼로그 — owner 만 사용. 처음엔 localStorage 마지막 은행정보 prefill.
export default function PaymentSettingsDialog({
  open,
  onOpenChange,
  initial,
  defaultHolderName,
  onSave,
  onClear
}) {
  const last = getLastBankAccount();
  const [totalCost, setTotalCost] = useState('');
  const [bank, setBank] = useState(BANK_OPTIONS[0]);
  const [accountNo, setAccountNo] = useState('');
  const [holderName, setHolderName] = useState('');
  const [memo, setMemo] = useState('');

  useEffect(() => {
    if (!open) return;
    setTotalCost(initial?.totalCost ? String(initial.totalCost) : '');
    setBank(initial?.bank ?? last?.bank ?? BANK_OPTIONS[0]);
    setAccountNo(initial?.accountNo ?? last?.accountNo ?? '');
    setHolderName(initial?.holderName ?? last?.holderName ?? defaultHolderName ?? '');
    setMemo(initial?.memo ?? '');
  }, [open]);

  const totalNum = Number(totalCost.replace(/[^\d]/g, ''));
  const isValid =
    totalNum > 0 && !!bank && accountNo.replace(/[^\d]/g, '').length >= 6 && !!holderName.trim();

  const handleSave = () => {
    if (!isValid) return;
    const payment = {
      totalCost: totalNum,
      bank,
      accountNo: accountNo.replace(/\s/g, ''),
      holderName: holderName.trim(),
      memo: memo.trim() || ''
    };
    rememberBankAccount({
      bank: payment.bank,
      accountNo: payment.accountNo,
      holderName: payment.holderName
    });
    onSave(payment);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>회비 정산 설정</DialogTitle>
          <p className="text-xs text-muted-foreground">
            구장 대여비 등 총액을 입력하면 참가자별 1/N 금액이 자동 계산돼요. 멤버는 토스 앱으로 한 번에 송금할 수 있어요.
          </p>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="total-cost">총 금액 (원)</Label>
            <Input
              id="total-cost"
              inputMode="numeric"
              placeholder="예) 80000"
              value={totalCost}
              onChange={(e) => setTotalCost(e.target.value.replace(/[^\d]/g, ''))}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bank">받는 은행</Label>
            <select
              id="bank"
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {BANK_OPTIONS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="account-no">계좌번호</Label>
            <Input
              id="account-no"
              inputMode="numeric"
              placeholder="숫자만 입력"
              value={accountNo}
              onChange={(e) => setAccountNo(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="holder">예금주</Label>
            <Input
              id="holder"
              placeholder="예금주 이름"
              value={holderName}
              onChange={(e) => setHolderName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="memo">메모 (선택)</Label>
            <Input
              id="memo"
              placeholder="예) 토요풋살 회비"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              maxLength={20}
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <div>
            {initial && onClear && (
              <Button
                variant="ghost"
                onClick={() => {
                  if (confirm('회비 설정을 삭제할까요?')) onClear();
                }}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                삭제
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button disabled={!isValid} onClick={handleSave}>
              저장
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
