import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";

interface ThemeContextType {
	isRTL: boolean;
	toggleDirection: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [isRTL, setIsRTL] = useState(true);

	useEffect(() => {
		document.documentElement.dir = isRTL ? "rtl" : "ltr";
		document.documentElement.lang = isRTL ? "ar" : "en";
	}, [isRTL]);

	const toggleDirection = () => {
		setIsRTL(!isRTL);
	};

	return (
		<ThemeContext.Provider value={{ isRTL, toggleDirection }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
}
