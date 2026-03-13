import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";

interface User {
	id: string;
	username: string;
	role: "admin" | "assistant";
	permissions: string[];
}

interface AuthContextType {
	user: User | null;
	token: string | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	login: (username: string, password: string) => Promise<void>;
	logout: () => void;
	hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL =
	import.meta.env.VITE_API_URL ||
	"https://englishhub.8bitsolutions.net/api/trpc";
const BASE_API_URL = API_URL.replace("/trpc", "");

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [token, setToken] = useState<string | null>(
		localStorage.getItem("token"),
	);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const storedUser = localStorage.getItem("user");
		const storedToken = localStorage.getItem("token");

		if (storedUser && storedToken) {
			try {
				// Parse the token to check if it's expired
				const tokenData = JSON.parse(atob(storedToken.split(".")[1]));
				const expirationTime = tokenData.exp * 1000; // Convert to milliseconds

				if (Date.now() >= expirationTime) {
					// Token is expired, clear it
					console.log("Token expired, logging out");
					localStorage.removeItem("token");
					localStorage.removeItem("user");
					setToken(null);
					setUser(null);
				} else {
					// Token is valid
					setUser(JSON.parse(storedUser));
					setToken(storedToken);
				}
			} catch (error) {
				// Invalid token format
				console.error("Invalid token:", error);
				localStorage.removeItem("token");
				localStorage.removeItem("user");
				setToken(null);
				setUser(null);
			}
		}
		setIsLoading(false);
	}, []);

	const login = async (username: string, password: string) => {
		const response = await fetch(`${BASE_API_URL}/auth/login`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username, password }),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.message || "فشل تسجيل الدخول");
		}

		const data = await response.json();
		setToken(data.token);
		setUser(data.user);
		localStorage.setItem("token", data.token);
		localStorage.setItem("user", JSON.stringify(data.user));
	};

	const logout = () => {
		setUser(null);
		setToken(null);
		localStorage.removeItem("token");
		localStorage.removeItem("user");
	};

	const hasPermission = (permission: string) => {
		if (!user) return false;
		if (user.role === "admin") return true;
		return user.permissions.includes(permission);
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				token,
				isAuthenticated: !!user,
				isLoading,
				login,
				logout,
				hasPermission,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
