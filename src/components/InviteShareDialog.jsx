import { useState } from 'react';
import { Check, Copy, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// variant:
//  - 'celebration' = 방금 그룹 만든 직후. 톤이 축하 + 자연스럽게 친구 부르기 유도
//  - 'share'       = 그룹 안의 "초대 링크" 버튼에서 재사용. 톤은 차분
export default function InviteShareDialog({ open, onOpenChange, group, variant = 'share' }) {
  const [copied, setCopied] = useState(false);

  if (!group) return null;

  const inviteUrl = `${window.location.origin}/join?code=${group.inviteCode}`;
  const messageText = `[MatchLink] "${group.name}" 그룹에 초대합니다.\n초대 코드: ${group.inviteCode}\n앱 열기: ${inviteUrl}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('복사에 실패했어요. 직접 길게 눌러 복사해주세요.');
    }
  };

  const isCelebration = variant === 'celebration';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isCelebration ? (
              <>
                <Sparkles className="h-5 w-5 text-amber-500" />
                그룹이 만들어졌어요!
              </>
            ) : (
              '친구 초대 링크'
            )}
          </DialogTitle>
          {isCelebration ? (
            <p className="text-sm text-muted-foreground">
              아래 메시지를 카톡 단톡방에 붙여넣으면 친구들이 한 번에 들어와요.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              이 메시지를 친구한테 보내면 코드 입력 화면이 자동으로 떠요.
            </p>
          )}
        </DialogHeader>

        {/* 카톡 메시지 풍 미리보기 */}
        <div className="rounded-2xl border border-border bg-[#FEE500]/15 p-3">
          <div className="rounded-xl bg-white p-3 text-[13px] leading-relaxed shadow-sm">
            <p className="m-0 whitespace-pre-line break-words text-slate-900">{messageText}</p>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            ↑ 카톡에 붙여넣으면 이렇게 보여요
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isCelebration ? '나중에 보낼게요' : '닫기'}
          </Button>
          <Button onClick={handleCopy} className="min-w-[140px]">
            {copied ? (
              <>
                <Check className="mr-1 h-4 w-4" /> 복사됨!
              </>
            ) : (
              <>
                <Copy className="mr-1 h-4 w-4" /> 메시지 복사
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
