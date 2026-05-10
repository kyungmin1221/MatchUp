import { useEffect, useState } from 'react';
import { subscribeGroupMatches, subscribeMatch, subscribeMyAwayMatches } from './api';
import { useUser } from '@/features/auth/hooks';

export function useMatch(matchId) {
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!matchId) {
      setMatch(null);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    const unsub = subscribeMatch(matchId, (m) => {
      setMatch(m);
      setLoading(false);
    });
    return unsub;
  }, [matchId]);
  return { match, loading };
}

export function useGroupMatches(groupId) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!groupId) return undefined;
    setLoading(true);
    const unsub = subscribeGroupMatches(groupId, (items) => {
      setMatches(items);
      setLoading(false);
    });
    return unsub;
  }, [groupId]);
  return { matches, loading };
}

// 본인이 awayMemberUids 에 들어간 매치 (다른 그룹의 매치에 상대팀으로 합류한 것)
export function useMyAwayMatches() {
  const user = useUser();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user) return undefined;
    setLoading(true);
    const unsub = subscribeMyAwayMatches(user.uid, (items) => {
      setMatches(items);
      setLoading(false);
    });
    return unsub;
  }, [user]);
  return { matches, loading };
}
