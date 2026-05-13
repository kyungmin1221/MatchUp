import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'matchup.introSeen';

export function markIntroSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    /* private mode 등 */
  }
}

export function hasSeenIntro() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

const STEPS = [
  {
    emoji: '⚽️',
    title: '매치',
    desc: '풋살/축구 한 번을 매치라고 불러요. 일정·장소·명단·포메이션을 한곳에 모아요.',
    extras: [
      {
        emoji: '🎯',
        title: '모집 투표가 같이 생겨요',
        desc: '매치를 만들면 "참석/불참/미정" 투표가 자동으로 같이 만들어져요. "참석"한 친구가 매치 명단에 자동으로 들어가요.'
      },
      {
        emoji: '🤝',
        title: '상대팀 자리도 같이',
        desc: '"상대팀 자리도 함께"로 매치를 만들면, 상대팀 캡틴에게 링크 한 번 보내고 양 팀 명단·포메이션을 공유해요.'
      }
    ]
  },
  {
    emoji: '💬',
    title: '투표',
    desc: '의사결정·인원 모집을 위한 투표예요. 두 가지 종류가 있어요.',
    extras: [
      {
        emoji: '🗳',
        title: '참석 의향 모집 투표',
        desc: '인원이 몇 명일지 모를 땐 투표 먼저 만들어 보세요. 모이면 그 투표를 매치로 바꿀 수 있어요.'
      },
      {
        emoji: '🗒',
        title: '일반 의견 투표',
        desc: '매치와 무관한 자유 투표 — 일정, 장소 후보, 회식 일정 등 자유 옵션으로 의견 모으기.'
      }
    ]
  }
];

export default function IntroDialog({ open, onOpenChange }) {
  const [expanded, setExpanded] = useState(() => Array(STEPS.length).fill(false));
  const toggle = (idx) =>
    setExpanded((prev) => prev.map((v, i) => (i === idx ? !v : v)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">MatchLink, 이렇게 쓰면 돼요</DialogTitle>
          <DialogDescription>
            단톡방에 흩어지던 풋살·축구 약속을 한 곳에 모아둘게요. 1분만 봐주세요!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {STEPS.map((s, idx) => (
            <div
              key={s.title}
              className="overflow-hidden rounded-md border bg-secondary/30"
            >
              <button
                type="button"
                onClick={() => toggle(idx)}
                className="flex w-full items-start gap-3 p-3 text-left transition hover:bg-secondary/50"
                aria-expanded={expanded[idx]}
              >
                <span className="text-2xl leading-none">{s.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.desc}</p>
                </div>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 shrink-0 self-center text-muted-foreground transition-transform',
                    expanded[idx] && 'rotate-180'
                  )}
                />
              </button>
              {expanded[idx] && (
                <div className="space-y-2 border-t border-border/60 bg-background/50 px-3 py-3">
                  {s.extras.map((ex) => (
                    <div key={ex.title} className="flex items-start gap-2.5">
                      <span className="text-lg leading-none">{ex.emoji}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{ex.title}</p>
                        <p className="text-xs text-muted-foreground">{ex.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="rounded-md border border-primary/40 bg-primary/5 p-3 text-xs leading-relaxed">
          <span className="font-medium">🎬 처음이라면</span> 위쪽의{' '}
          <strong>새 매치</strong> 또는 <strong>새 투표 → 참석 의향 모집</strong>부터
          만들어 보세요. 친구는 매치·투표 카드의 참석 버튼만 누르면 끝!
          <br />
          <span className="mt-1 inline-block text-muted-foreground">
            💡 혼자 매치 한 번 만들어보고 친구 부르셔도 돼요. 부담 없이 시작!
          </span>
        </p>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
