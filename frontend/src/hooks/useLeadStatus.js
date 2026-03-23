// hooks/useLeadStatus.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';

const RANK = { Pending: 0, Accepted: 1, 'In Review': 2, Completed: 3, Closed: 4 };
const higher = (a,b) => (RANK[a] ?? -1) >= (RANK[b] ?? -1) ? a : b;

export function useLeadStatus({ caseId, leadNo, leadName }) {
  const queryClient = useQueryClient();
  const key = ['lead-status', caseId, leadNo, leadName];

  const { data: status = 'Pending', isFetching } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data } = await api.get(
        `/api/lead/status/${leadNo}/${encodeURIComponent(leadName)}/${caseId}`
      );
      return data.leadStatus || data.status || 'Pending';
    },
    staleTime: 30_000, // avoids refetch thrash
    select: (incoming) => incoming, // keep simple now
  });

  const setLocalStatus = (next) => {
    queryClient.setQueryData(key, (prev) => (prev ? higher(prev, next) : next));
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      // your submit call(s) here …
      // await api.post('/api/leadReturn/create', …)
      // await api.put('/api/lead/status/in-review', …)
      return 'In Review';
    },
    onMutate: async () => {
      // optimistic update
      setLocalStatus('In Review');
    },
    onSuccess: (serverStatus) => {
      setLocalStatus(serverStatus || 'In Review');
    },
    onError: () => {
      // optional: invalidate to refetch accurate server state
      queryClient.invalidateQueries({ queryKey: key });
    },
  });

  const userRole = localStorage.getItem('role') || '';
  const canEditInReview = userRole === 'Case Manager' || userRole === 'Detective Supervisor';
  const isReadOnly = status === 'In Review'
    ? !canEditInReview
    : ['Completed', 'Closed'].includes(status);

  return { status, isReadOnly, isFetching, setLocalStatus, submitMutation };
}
