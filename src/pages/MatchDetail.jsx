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
import { useRecruitingPollByMatch } from '@/features/poll/hooks';
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

const FALLBACK_GROUP_ID_PARAM = '_';

export default function MatchDetail() {
  const { groupId, matchId } = useParams();
  const user = useUser();
  const navigate = useNavigate();

  const { match, loading } = useMatch(matchId);

  const { group: ourGroup } = useGroup(match?.groupId);
  const isOwner = !!user && ourGroup?.ownerUid === user.uid;

  // 본인이 home 측인지 away 측인지 결정
  const isHomeMember = !!user && (ourGroup?.memberUids ?? []).includes(user.uid);
  const isAwayMember = !!user && (match?.awayMemberUids ?? []).includes(user.uid);
  const mySide = isHomeMember ? 'home' : isAwayMember ? 'away' : null;

  const homePlayerUids = match?.homeTeam?.playerUids ?? [];
  const awayPlayerUids = match?.awayTeam?.playerUids ?? [];
  const { data: homePlayers = [] } = useMembers(homePlayerUids);
  const { data: awayPlayers = [] } = useMembers(awayPlayerUids);

  const { poll: recruitingPoll } = useRecruitingPollByMatch({
    groupId: match?.groupId,
    matchId
  });

  const matchKind = match?.kind ?? 'football';
  const formationOptions = useMemo(() => formationsByKind(matchKind), [matchKind]);

  // 본인 측 매치 포메이션 슬롯 자동 채움
  const mySideFormation =
    mySide === 'away'
      ? match?.awayTeam?.formation
      : match?.homeTeam?.formation;
  useEffect(() => {
    if (!match || !mySide) return;
    const isValidType = formationOptions.some(([key]) => key === mySideFormation?.type);
    if (!mySideFormation?.positions?.length || !isValidType) {
      const nextType = isValidType ? mySideFormation.type : DEFAULT_FORMATION[matchKind];
      updateFormation({ matchId, formation: buildFormation(nextType), side: mySide });
    }
  }, [match, mySide, mySideFormation, matchId, matchKind, formationOptions]);

  const isParticipant =
    mySide === 'away'
      ? awayPlayerUids.includes(user?.uid)
      : homePlayerUids.includes(user?.uid);

  const handleToggleJoin = async () => {
    if (!user || !mySide) return;
    await togglePlayer({ matchId, uid: user.uid, join: !isParticipant, side: mySide });
  };

  const handleFormationType = async (type) => {
    if (!mySide) return;
    await updateFormation({ matchId, formation: buildFormation(type), side: mySide });
  };

  const handleFormationChange = async (next) => {
    if (!mySide) return;
    await updateFormation({ matchId, formation: next, side: mySide });
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

  const copyOpponentJoinLink = async () => {
    if (!match?.awayInviteCode) return;
    const url = `${window.location.origin}/match-invite?code=${match.awayInviteCode}`;
    const text = `[MatchUp] ${ourGroup?.name ?? ''} - ${match.title} 대항전 합류 링크\n${url}`;
    await navigator.clipboard.writeText(text);
    alert('상대팀 합류 링크를 복사했어요!');
  };

  const handleDeleteMatch = async () => {
    if (!confirm('이 매치를 삭제할까요? 되돌릴 수 없어요.')) return;
    try {
      await deleteMatch({ matchId });
      navigate(
        groupId === FALLBACK_GROUP_ID_PARAM ? '/groups' : `/groups/${groupId}`,
        { replace: true }
      );
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

  const hasOpponent = !!match.awayTeam;
  const backHref =
    mySide === 'away'
      ? '/groups'
      : `/groups/${match.groupId}`;
  const backLabel = mySide === 'away' ? '내 그룹' : '그룹으로';

  return (
    <AppShell>
      <div className="mb-4">
        <Link
          to={backHref}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> {backLabel}
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{match.title}</h1>
          <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
            {match.scheduledAt && <p>{formatDateTime(match.scheduledAt)}</p>}
            {match.location && <p>📍 {match.location}</p>}
            {mySide === 'away' && (
              <p className="text-primary">상대팀(어웨이)으로 참여 중</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasOpponent && match.awayInviteCode && mySide === 'home' && (
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

      {recruitingPoll && ourGroup && mySide === 'home' && (
        <div className="mb-4">
          <PollCard poll={recruitingPoll} group={ourGroup} />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <TeamPanel
          match={{ ...match, homeTeam: match.homeTeam }}
          team={match.homeTeam}
          players={homePlayers}
          isMine={mySide === 'home'}
          isParticipant={mySide === 'home' && isParticipant}
          onToggleJoin={handleToggleJoin}
          onFormationChange={handleFormationChange}
          onFormationType={handleFormationType}
          formationOptions={formationOptions}
          recruitingHint={
            mySide === 'home' && recruitingPoll
              ? '명단은 모집 투표 결과로 자동 채워져요. 위쪽의 모집 투표에서 응답해주세요.'
              : null
          }
          sideLabel="홈"
        />
        {hasOpponent && (
          <TeamPanel
            match={{ ...match, homeTeam: match.awayTeam }}
            team={match.awayTeam}
            players={awayPlayers}
            isMine={mySide === 'away'}
            isParticipant={mySide === 'away' && isParticipant}
            onToggleJoin={handleToggleJoin}
            onFormationChange={handleFormationChange}
            onFormationType={handleFormationType}
            formationOptions={formationOptions}
            sideLabel="어웨이"
          />
        )}
      </div>
    </AppShell>
  );
}
