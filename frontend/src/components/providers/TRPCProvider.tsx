import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

const API_URL =
	import.meta.env.VITE_API_URL ||
	"https://englishhub.8bitsolutions.net/api/trpc";

export function TRPCProvider({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 5 * 60 * 1000,
						retry: 1,
						refetchOnWindowFocus: false, // Prevent refetch on window focus
						refetchOnReconnect: false, // Prevent refetch on reconnect
					},
				},
			}),
	);

	const [trpcClient] = useState(() =>
		trpc.createClient({
			links: [
				httpBatchLink({
					url: API_URL,
					async headers() {
						const token = localStorage.getItem("token");
						return {
							Authorization: token ? `Bearer ${token}` : "",
						};
					},
					fetch: async (url, options) => {
						const response = await fetch(url, options);

						// Handle unauthorized errors
						if (response.status === 401) {
							// Clear auth data
							localStorage.removeItem("token");
							localStorage.removeItem("user");
							// Redirect to login
							window.location.href = "/login";
							return Promise.reject(new Error("Unauthorized"));
						}

						return response;
					},
				}),
			],
		}),
	);

	return (
		<trpc.Provider client={trpcClient} queryClient={queryClient}>
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</trpc.Provider>
	);
}
