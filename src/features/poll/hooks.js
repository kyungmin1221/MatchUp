import { useEffect, useState } from 'react';
import { subscribeGroupPolls } from './api';

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
