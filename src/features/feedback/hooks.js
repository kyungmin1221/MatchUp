import { useEffect, useState } from 'react';
import { subscribeAllFeedback } from './api';

export function useAllFeedback() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeAllFeedback(
      (next) => {
        setItems(next);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  return { items, loading, error };
}
