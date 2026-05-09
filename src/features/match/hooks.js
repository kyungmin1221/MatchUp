import { useEffect, useState } from 'react';
import { subscribeGroupMatches, subscribeMatch } from './api';

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
