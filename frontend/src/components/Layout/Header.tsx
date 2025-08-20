import React from "react";
import { Sun, Moon, FileText } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

const Header: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="header">
            <div className="header-content">
                <div className="header-left">
                    <div className="logo">
                        <FileText className="logo-icon" />
                        <span className="logo-text">DocumentAI</span>
                    </div>
                </div>

                <div className="header-right">
                    <button
                        onClick={toggleTheme}
                        className="theme-toggle"
                        aria-label="Toggle theme"
                    >
                        {theme === "light" ? (
                            <Moon className="theme-icon" />
                        ) : (
                            <Sun className="theme-icon" />
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
