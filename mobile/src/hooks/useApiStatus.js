import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

export function useApiStatus() {
  return useQuery({
    queryKey: ['apiHealth'],
    queryFn: async () => {
      return await apiClient.get(ENDPOINTS.HEALTH);
    },
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 30000,
  });
}

export default useApiStatus;

