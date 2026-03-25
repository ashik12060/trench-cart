import { QueryClient } from '@tanstack/react-query';


export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			refetchOnMount: false,
			refetchOnReconnect: false,
			staleTime: 5 * 60 * 1000,
			gcTime: 30 * 60 * 1000,
			retry: 1,
		},
	},
});
