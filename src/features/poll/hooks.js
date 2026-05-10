import { useEffect, useState } from 'react';
import { subscribeGroupPolls, subscribePoll } from './api';

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
