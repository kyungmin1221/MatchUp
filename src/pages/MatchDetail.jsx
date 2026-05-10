import { useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Trash2 } from 'lucide-react';
import AppShell from '@/components/AppShell';
import TeamPanel from '@/components/TeamPanel';
import PollCard from '@/components/PollCard';
import { Button } from '@/components/ui/button';
import { useUser } from '@/features/auth/hooks';
import { useGroup, useMembers } from '@/features/group/hooks';
import { useMatch } from '@/features/match/hooks';
import { usePoll } from '@/features/poll/hooks';
import {
  deleteMatch,
  togglePlayer,
  updateFormation,
  updateMatchKind
} from '@/features/match/api';
import {
  DEFAULT_FORMATION,
  buildFormation,
  formationsByKind
} from '@/features/formation/templates';
import { formatDateTime } from '@/lib/utils';

export default function MatchDetail() {
  const { groupId, matchId } = useParams();
  const user = useUser();
  const navigate = useNavigate();

  const { match, loading } = useMatch(matchId);
  const { match: opponent } = useMatch(match?.opponentMatchId);

  const { group: ourGroup } = useGroup(match?.groupId);
  const { group: oppGroup } = useGroup(opponent?.groupId);
  const isOwner = !!user && ourGroup?.ownerUid === user.uid;

  const { poll: recruitingPoll } = usePoll(match?.recruitingPollId);

  const myPlayerUids = match?.homeTeam.playerUids ?? [];
  const oppPlayerUids = opponent?.homeTeam.playerUids ?? [];
  const { data: myPlayers = [] } = useMembers(myPlayerUids);
  const { data: oppPlayers = [] } = useMembers(oppPlayerUids);

  const matchKind = match?.kind ?? 'football';
  const formationOptions = useMemo(() => formationsByKind(matchKind), [matchKind]);

  // 우리 매치에 포메이션 슬롯이 비어 있거나 종목과 안 맞으면 자동 채움
  const myFormation = match?.homeTeam.formation;
  useEffect(() => {
    if (!match) return;
    const isValidType = formationOptions.some(([key]) => key === myFormation?.type);
    if (!myFormation?.positions?.length || !isValidType) {
      const nextType = isValidType ? myFormation.type : DEFAULT_FORMATION[matchKind];
      updateFormation({ matchId, formation: buildFormation(nextType) });
    }
  }, [match, myFormation, matchId, matchKind, formationOptions]);

  // 상대팀 매치에 캡틴이 합류했는데 포메이션이 비었으면 슬롯 자동 채움 (편집권자만)
  const oppFormation = opponent?.homeTeam.formation;
  useEffect(() => {
    if (!opponent || !user) return;
    // 상대 매치를 편집할 권한이 있어야 함 (= 상대팀 그룹 멤버여야 함)
    // 새도우 그룹은 우리도 멤버라 update 가능하지만, 의도적으로 상대 매치는 건드리지 않는다.
    // → 빈 포메이션 자동 채우기는 캡틴(=상대팀)이 자기 매치 페이지에 진입했을 때만 실행되도록 우리는 패스.
  }, [opponent, oppFormation, user]);

  const isParticipant = !!user && myPlayerUids.includes(user.uid);

  const handleToggleJoin = async () => {
    if (!user) return;
    await togglePlayer({ matchId, uid: user.uid, join: !isParticipant });
  };

  const handleFormationType = async (type) => {
    await updateFormation({ matchId, formation: buildFormation(type) });
  };

  const handleFormationChange = async (next) => {
    await updateFormation({ matchId, formation: next });
  };

  const copyOpponentJoinLink = async () => {
    if (!opponent || !oppGroup) return;
    const url = `${window.location.origin}/join?code=${oppGroup.inviteCode}&matchId=${opponent.id}`;
    await navigator.clipboard.writeText(url);
    alert('상대팀 합류 링크를 복사했어요!');
  };

  const handleChangeKind = async (nextKind) => {
    if (!match || nextKind === matchKind) return;
    if (
      !confirm(
        `종목을 ${nextKind === 'football' ? '축구 (11인)' : '풋살 (5인)'}로 바꿀까요?\n현재 포메이션은 새 종목의 기본 포메이션으로 교체돼요.`
      )
    )
      return;
    try {
      await updateMatchKind({ matchId, kind: nextKind });
    } catch (e) {
      alert(e.message ?? '종목 변경에 실패했어요.');
    }
  };

  const handleDeleteMatch = async () => {
    if (!confirm('이 매치를 삭제할까요? 되돌릴 수 없어요.')) return;
    try {
      await deleteMatch({ matchId });
      navigate(`/groups/${groupId}`, { replace: true });
    } catch (e) {
      alert(e.message);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <p className="text-muted-foreground">불러오는 중…</p>
      </AppShell>
    );
  }
  if (!match) {
    return (
      <AppShell>
        <p>매치를 찾을 수 없어요.</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-4">
        <Link
          to={`/groups/${groupId}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> 그룹으로
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{match.title}</h1>
          <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
            {match.scheduledAt && <p>{formatDateTime(match.scheduledAt)}</p>}
            {match.location && <p>📍 {match.location}</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {opponent && oppGroup && (
            <Button variant="outline" size="sm" onClick={copyOpponentJoinLink}>
              <Share2 className="mr-1 h-4 w-4" /> 상대팀 합류 링크
            </Button>
          )}
          {isOwner && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteMatch}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="mr-1 h-4 w-4" /> 매치 삭제
            </Button>
          )}
        </div>
      </div>

      {isOwner && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">종목:</span>
          {[
            { v: 'football', label: '⚽ 축구 (11인)' },
            { v: 'futsal', label: '🥅 풋살 (5인)' }
          ].map((opt) => (
            <button
              key={opt.v}
              type="button"
              onClick={() => handleChangeKind(opt.v)}
              className={
                matchKind === opt.v
                  ? 'rounded-md border border-primary bg-primary/15 px-3 py-1 text-primary'
                  : 'rounded-md border border-border bg-background px-3 py-1 hover:border-primary/40'
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {recruitingPoll && ourGroup && (
        <div className="mb-4">
          <PollCard poll={recruitingPoll} group={ourGroup} />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <TeamPanel
          match={match}
          players={myPlayers}
          isMine
          isParticipant={isParticipant}
          onToggleJoin={handleToggleJoin}
          onFormationChange={handleFormationChange}
          onFormationType={handleFormationType}
          formationOptions={formationOptions}
          recruitingHint={
            match.recruitingPollId
              ? '명단은 모집 투표 결과로 자동 채워져요. 그룹 페이지의 모집 투표에서 응답해주세요.'
              : null
          }
        />
        {match.opponentMatchId && (
          <TeamPanel match={opponent} players={oppPlayers} isMine={false} />
        )}
      </div>
    </AppShell>
  );
}
