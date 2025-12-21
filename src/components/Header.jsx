import { useState, useEffect } from "react";
import { FiSun, FiMoon } from "react-icons/fi";

function Header() {
    const [darkMode, setDarkMode] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState("about");

    const navItems = ["About", "Projects"]; // Removed "Contact"

    // Apply dark class to html root when toggled
    useEffect(() => {
        const html = document.documentElement;
        if (darkMode) html.classList.add("dark");
        else html.classList.remove("dark");
    }, [darkMode]);

    // Close mobile menu when resizing to desktop widths
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setMenuOpen(false);
            }
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Scroll listener to update active section automatically
    useEffect(() => {
        const handleScroll = () => {
            const scrollPos = window.scrollY + 100;
            let current = "about";

            navItems.forEach((item) => {
                const section = document.getElementById(item.toLowerCase());
                if (section && section.offsetTop <= scrollPos) {
                    current = item.toLowerCase();
                }
            });
            setActiveSection(current);
        };

        window.addEventListener("scroll", handleScroll);
        handleScroll();
        return () => window.removeEventListener("scroll", handleScroll);
    }, [navItems]);

    const DarkModeSwitch = () => (
        <button
            onClick={() => setDarkMode((s) => !s)}
            className={`relative inline-flex h-8 w-16 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-yellow-400
            ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}
            aria-pressed={darkMode}
            aria-label="Toggle dark mode"
        >
            <span
                className={`absolute left-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md transform transition-all duration-300 ease-in-out
              ${darkMode ? "translate-x-8 rotate-180" : "translate-x-0 rotate-0"}`}
            >
                {darkMode ? (
                    <FiSun size={16} className="text-yellow-400" />
                ) : (
                    <FiMoon size={16} className="text-blue-500" />
                )}
            </span>
        </button>
    );

    return (
        <header className="w-full bg-primary-light dark:bg-primary-dark shadow-md transition-colors duration-500 sticky top-0 z-50">
            <div className="max-w-5xl mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">
                <h1 className="text-xl font-bold text-secondary-light dark:text-secondary-dark transition-colors duration-500">
                    <FiMoon size={16} className="text-slate-500 animate-pulse-slow" />
                </h1>

                {/* Desktop nav */}
                <nav className="hidden md:flex items-center space-x-2 animate-fade-in">
                    {navItems.map((item) => {
                        const key = item.toLowerCase();
                        const isActive = activeSection === key;
                        return (
                            <a
                                key={item}
                                href={`#${key}`}
                                onClick={() => setActiveSection(key)}
                                role="link"
                                className={`px-2 py-1 font-semibold transition-all duration-300 rounded-md
                  ${isActive
                                        ? "text-blue-500 dark:text-yellow-400 bg-blue-50 dark:bg-yellow-950/20"
                                        : "text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-yellow-400"}
                  hover:bg-blue-50 dark:hover:bg-yellow-950/20 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-yellow-400`}
                            >
                                {item}
                            </a>
                        );
                    })}
                    <DarkModeSwitch />
                </nav>

                {/* Mobile burger button */}
                <button
                    className="md:hidden p-2 rounded-md focus:outline-none bg-secondary-light/10 dark:bg-secondary-dark/10 relative z-50 transition-all duration-300 hover:bg-secondary-light/20 dark:hover:bg-secondary-dark/20"
                    onClick={() => setMenuOpen((s) => !s)}
                    aria-expanded={menuOpen}
                    aria-label="Toggle menu"
                >
                    <div className="w-6 h-5 relative">
                        <span
                            className={`absolute top-0 left-0 w-full h-0.5 bg-gray-700 dark:bg-gray-300 rounded-full transform transition-all duration-300 ${menuOpen ? "rotate-45 top-2" : ""
                                }`}
                        />
                        <span
                            className={`absolute top-2 left-0 w-full h-0.5 bg-gray-700 dark:bg-gray-300 rounded-full transition-all duration-300 ${menuOpen ? "opacity-0" : "opacity-100"
                                }`}
                        />
                        <span
                            className={`absolute bottom-0 left-0 w-full h-0.5 bg-gray-700 dark:bg-gray-300 rounded-full transform transition-all duration-300 ${menuOpen ? "-rotate-45 bottom-2" : ""
                                }`}
                        />
                    </div>
                </button>

                {/* Mobile menu */}
                <div
                    className={`md:hidden absolute top-full left-0 right-0 bg-primary-light dark:bg-primary-dark shadow-lg transform transition-all duration-300 ease-in-out ${menuOpen
                            ? "opacity-100 translate-y-0 pointer-events-auto"
                            : "opacity-0 -translate-y-2 pointer-events-none"
                        }`}
                >
                    <nav className="flex flex-col gap-1 px-4 lg:px-8 py-4 max-w-5xl mx-auto animate-slide-in">
                        {navItems.map((item) => {
                            const key = item.toLowerCase();
                            const isActive = activeSection === key;
                            return (
                                <a
                                    key={item}
                                    href={`#${key}`}
                                    onClick={() => {
                                        setMenuOpen(false);
                                        setActiveSection(key);
                                    }}
                                    className={`px-3 py-2 font-semibold rounded-md transition-all duration-300
                    ${isActive
                                            ? "text-blue-500 dark:text-yellow-400 bg-blue-50 dark:bg-yellow-950/20"
                                            : "text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-yellow-400"}
                    hover:bg-blue-50 dark:hover:bg-yellow-950/20 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-yellow-400`}
                                >
                                    {item}
                                </a>
                            );
                        })}
                        <div className="flex justify-start mt-2 px-3 py-2">
                            <DarkModeSwitch />
                        </div>
                    </nav>
                </div>
            </div>
        </header>
    );
}

export default Header;