import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut, Share2, Trash2 } from 'lucide-react';
import AppShell from '@/components/AppShell';
import TeamPanel from '@/components/TeamPanel';
import PollCard from '@/components/PollCard';
import MatchScoreboard from '@/components/MatchScoreboard';
import MomBanner from '@/components/MomBanner';
import MomDialog from '@/components/MomDialog';
import PaymentCard from '@/components/PaymentCard';
import PaymentSettingsDialog from '@/components/PaymentSettingsDialog';
import { Button } from '@/components/ui/button';
import { useUser } from '@/features/auth/hooks';
import { useGroup, useMembers } from '@/features/group/hooks';
import { useMatch } from '@/features/match/hooks';
import { useRecruitingPollByMatch } from '@/features/poll/hooks';
import {
  clearMatchPayment,
  deleteMatch,
  leaveMatchAsAway,
  togglePlayer,
  updateFormation,
  updateMatchKind,
  updateMatchPayment,
  voteMom
} from '@/features/match/api';
import { getMomPhase, tallyMom } from '@/features/match/mom';
import {
  DEFAULT_FORMATION,
  buildFormation,
  formationsByKind
} from '@/features/formation/templates';

const FALLBACK_GROUP_ID_PARAM = '_';

export default function MatchDetail() {
  const { groupId, matchId } = useParams();
  const user = useUser();
  const navigate = useNavigate();

  const { match, loading } = useMatch(matchId);

  const { group: ourGroup } = useGroup(match?.groupId);
  const isOwner = !!user && ourGroup?.ownerUid === user.uid;

  // 본인이 home 측인지 away 측인지 결정.
  // away (awayMemberUids) 가 우선 — 매치 초대 링크로 합류한 사용자는 home 그룹 멤버이기도 해도 away 로 처리.
  const isHomeMember = !!user && (ourGroup?.memberUids ?? []).includes(user.uid);
  const isAwayMember = !!user && (match?.awayMemberUids ?? []).includes(user.uid);
  const mySide = isAwayMember ? 'away' : isHomeMember ? 'home' : null;

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

  const handleLeaveMatch = async () => {
    if (!user) return;
    if (
      !confirm(
        '이 매치를 나갈까요?\n명단·포메이션에서 빠지고 더 이상 매치를 볼 수 없어요. 다시 들어가려면 합류 링크가 필요해요.'
      )
    )
      return;
    try {
      await leaveMatchAsAway({ matchId, uid: user.uid });
      navigate('/groups', { replace: true });
    } catch (e) {
      alert(e.message);
    }
  };

  // ─── MOM (Man of the Match) ──────────────────────────────
  const momPhase = useMemo(() => getMomPhase(match), [match]);
  const momResult = useMemo(() => tallyMom(match?.momVotes), [match?.momVotes]);
  const myVote = user ? match?.momVotes?.[user.uid] ?? null : null;
  const isMom = !!user && momResult.winners.includes(user.uid);
  const dismissKey = `matchup.momDismissed.${matchId}`;
  const [momDismissed, setMomDismissed] = useState(() => {
    try {
      return localStorage.getItem(dismissKey) === '1';
    } catch {
      return false;
    }
  });
  const [momDialogOpen, setMomDialogOpen] = useState(false);

  // 본인 팀 참가자만 후보. 결과 단계에서는 양 팀에서 모두 이름을 찾아야 하므로 별도 lookup 사용.
  const myTeamCandidates = mySide === 'away' ? awayPlayers : homePlayers;
  const allRosterById = useMemo(() => {
    const map = {};
    homePlayers.forEach((p) => { map[p.id] = p; });
    awayPlayers.forEach((p) => { map[p.id] = p; });
    return map;
  }, [homePlayers, awayPlayers]);
  const winnerNames = momResult.winners.map(
    (uid) => allRosterById[uid]?.displayName ?? '알 수 없음'
  );

  // 투표 가능 조건: 본인이 home/away 참가자 + 본인 팀에 후보가 있음
  const canVote =
    momPhase.phase === 'voting' && !!mySide && myTeamCandidates.length > 0;

  // 자동 팝업 — voting 상태 + 미투표 + 미dismiss + 투표 가능
  useEffect(() => {
    if (canVote && !myVote && !momDismissed) {
      setMomDialogOpen(true);
    }
  }, [canVote, myVote, momDismissed]);

  const handleMomDismiss = () => {
    try {
      localStorage.setItem(dismissKey, '1');
    } catch {
      /* ignore */
    }
    setMomDismissed(true);
    setMomDialogOpen(false);
  };

  const handleMomVote = async (votedFor) => {
    if (!user) return;
    try {
      await voteMom({ matchId, voterUid: user.uid, votedFor });
      setMomDialogOpen(false);
    } catch (e) {
      alert(e.message ?? 'MOM 투표에 실패했어요.');
    }
  };

  // ─── 회비 정산 ──────────────────────────────────────────
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const handlePaymentSave = async (payment) => {
    try {
      await updateMatchPayment({ matchId, payment });
      setPaymentDialogOpen(false);
    } catch (e) {
      alert(e.message ?? '회비 저장에 실패했어요.');
    }
  };
  const handlePaymentClear = async () => {
    try {
      await clearMatchPayment({ matchId });
      setPaymentDialogOpen(false);
    } catch (e) {
      alert(e.message ?? '회비 삭제에 실패했어요.');
    }
  };

  const handleMomShare = async () => {
    const lines = [`[MatchUp] ${match.title} MOM 🏆`];
    if (winnerNames.length === 1) {
      lines.push(`${winnerNames[0]} (${momResult.max}표)`);
    } else if (winnerNames.length > 1) {
      lines.push(`공동 MOM · ${winnerNames.join(', ')} (각 ${momResult.max}표)`);
    } else {
      lines.push('투표 없음');
    }
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      alert('카톡 공유 텍스트를 복사했어요.');
    } catch {
      alert('복사에 실패했어요.');
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

      <MatchScoreboard match={match} ourGroupName={ourGroup?.name} />

      {(momPhase.phase === 'voting' || momPhase.phase === 'closed') && (
        <MomBanner
          phase={momPhase.phase}
          hasVoted={!!myVote}
          isMom={isMom}
          isOwner={isOwner}
          winners={momResult.winners}
          winnerNames={winnerNames}
          voteCount={momResult.max}
          deadlineMs={momPhase.deadlineMs}
          onOpen={() => setMomDialogOpen(true)}
          onShare={handleMomShare}
        />
      )}

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold leading-tight">{match.title}</h1>
          {mySide === 'away' && (
            <p className="mt-1 text-sm font-semibold text-primary">상대팀(어웨이)으로 참여 중</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {hasOpponent && match.awayInviteCode && mySide === 'home' && (
            <Button variant="outline" size="sm" onClick={copyOpponentJoinLink}>
              <Share2 className="mr-1 h-4 w-4" /> 상대팀 합류 링크
            </Button>
          )}
          {mySide === 'away' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLeaveMatch}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="mr-1 h-4 w-4" /> 매치 나가기
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

      {mySide === 'home' && (
        <div className="mb-4">
          <PaymentCard
            payment={match.payment ?? null}
            isOwner={isOwner}
            isParticipant={homePlayerUids.includes(user?.uid)}
            splitCount={Math.max(1, homePlayerUids.length)}
            matchTitle={match.title}
            onEdit={() => setPaymentDialogOpen(true)}
          />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* 본인 팀이 항상 좌측에 오도록 mySide 에 따라 순서 변경 */}
        {mySide === 'away' && hasOpponent ? (
          <>
            <TeamPanel
              team={match.awayTeam}
              players={awayPlayers}
              isMine
              isParticipant={isParticipant}
              onToggleJoin={handleToggleJoin}
              onFormationChange={handleFormationChange}
              onFormationType={handleFormationType}
              formationOptions={formationOptions}
              sideLabel="어웨이"
            />
            <TeamPanel
              team={match.homeTeam}
              players={homePlayers}
              isMine={false}
              sideLabel="홈"
            />
          </>
        ) : (
          <>
            <TeamPanel
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
                team={match.awayTeam}
                players={awayPlayers}
                isMine={false}
                sideLabel="어웨이"
              />
            )}
          </>
        )}
      </div>

      <MomDialog
        open={momDialogOpen}
        onOpenChange={setMomDialogOpen}
        candidates={myTeamCandidates}
        myVote={myVote}
        matchTitle={match.title}
        isMyselfCandidate={!!user && myTeamCandidates.some((p) => p.id === user.uid)}
        onVote={handleMomVote}
        onDismiss={handleMomDismiss}
        readOnly={momPhase.phase !== 'voting'}
      />

      <PaymentSettingsDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        initial={match.payment ?? null}
        defaultHolderName={user?.displayName}
        onSave={handlePaymentSave}
        onClear={match.payment ? handlePaymentClear : null}
      />
    </AppShell>
  );
}
