import { useEffect, useState } from 'react';
import { subscribeGroupPolls, subscribePoll, subscribePollByMatch } from './api';

export function useGroupPolls(groupId) {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!groupId) return undefined;
    setLoading(true);
    const unsub = subscribeGroupPolls(groupId, (items) => {
      setPolls(items);
      setLoading(false);
    });
    return unsub;
  }, [groupId]);
  return { polls, loading };
}

export function usePoll(pollId) {
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!pollId) {
      setPoll(null);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    const unsub = subscribePoll(pollId, (p) => {
      setPoll(p);
      setLoading(false);
    });
    return unsub;
  }, [pollId]);
  return { poll, loading };
}

// 매치의 모집 투표를 polls.matchId 로 찾는다. recruitingPollId 캐시가 stale 해도 자동 복구.
export function useRecruitingPollByMatch({ groupId, matchId }) {
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!groupId || !matchId) {
      setPoll(null);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    const unsub = subscribePollByMatch({ groupId, matchId }, (p) => {
      setPoll(p);
      setLoading(false);
    });
    return unsub;
  }, [groupId, matchId]);
  return { poll, loading };
}
