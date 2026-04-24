// hooks/useLeadStatus.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { STATUS_RANK } from '../utils/status';

const higher = (a, b) => (STATUS_RANK[a] ?? -1) >= (STATUS_RANK[b] ?? -1) ? a : b;

export function useLeadStatus({ caseId, leadNo, leadName, initialStatus }) {
  const queryClient = useQueryClient();
  const key = ['lead-status', caseId, leadNo];

  const { data: status = initialStatus || 'Pending', isFetching } = useQuery({
    queryKey: key,
    enabled: !!(caseId && leadNo),
    queryFn: async () => {
      const { data } = await api.get(
        `/api/lead/status/${leadNo}/${caseId}`
      );
      return data.leadStatus || data.status || 'Pending';
    },
    staleTime: 30_000,
    initialData: () => queryClient.getQueryData(key) ?? initialStatus ?? undefined,
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
  const canEditInReview = ['Case Manager', 'Detective Supervisor', 'Admin'].includes(userRole);
  const isReadOnly = status === 'In Review'
    ? !canEditInReview
    : ['Approved', 'Completed', 'Closed', 'Deleted'].includes(status);

  return { status, isReadOnly, isFetching, setLocalStatus, submitMutation };
}
