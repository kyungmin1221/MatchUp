import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/features/auth/hooks';
import { getGroupMembers, subscribeGroup, subscribeMyGroups } from './api';

export function useMyGroups({ includeShadow = false } = {}) {
  const user = useUser();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user) return undefined;
    setLoading(true);
    const unsub = subscribeMyGroups(user.uid, (items) => {
      const filtered = includeShadow
        ? items
        : items.filter((g) => g.kind !== 'opponent-shadow');
      setGroups(filtered);
      setLoading(false);
    });
    return unsub;
  }, [user, includeShadow]);
  return { groups, loading };
}

export function useGroup(groupId) {
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!groupId) return undefined;
    setLoading(true);
    const unsub = subscribeGroup(groupId, (g) => {
      setGroup(g);
      setLoading(false);
    });
    return unsub;
  }, [groupId]);
  return { group, loading };
}

export function useMembers(memberUids) {
  return useQuery({
    queryKey: ['members', memberUids?.slice().sort().join(',')],
    queryFn: () => getGroupMembers(memberUids ?? []),
    enabled: !!memberUids?.length,
    staleTime: 1000 * 60 * 5
  });
}
