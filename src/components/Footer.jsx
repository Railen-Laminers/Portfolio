import { useState, useEffect } from "react";
import {
    FaFacebook,
    FaTelegramPlane,
    FaEnvelope,
    FaGithub,
    FaArrowUp,
} from "react-icons/fa";

function Footer() {
    const [showBackToTop, setShowBackToTop] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 300);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const contacts = [
        {
            icon: <FaFacebook />,
            link: "https://www.facebook.com/share/1KHPY1vVw1/",
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-500/10 dark:bg-blue-400/10",
        },
        {
            icon: <FaEnvelope />,
            link: "mailto:railen.laminero@gmail.com",
            color: "text-red-600 dark:text-red-400",
            bg: "bg-red-500/10 dark:bg-red-400/10",
        },
        {
            icon: <FaTelegramPlane />,
            link: "https://t.me/Railen_Laminero",
            color: "text-blue-500 dark:text-blue-300",
            bg: "bg-blue-500/10 dark:bg-blue-300/10",
        },
        {
            icon: <FaGithub />,
            link: "https://github.com/Railen-Laminers",
            color: "text-gray-700 dark:text-gray-300",
            bg: "bg-gray-500/10 dark:bg-gray-700/10",
        },
    ];

    return (
        <>
            {/* Back to Top Button */}
            <button
                onClick={scrollToTop}
                className={`fixed bottom-4 right-4 md:bottom-6 md:right-6 bg-accent-light dark:bg-accent-dark text-white p-2.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-40 
          ${showBackToTop
                        ? "translate-y-0 opacity-100 scale-100"
                        : "translate-y-8 opacity-0 scale-90 pointer-events-none"
                    }`}
                aria-label="Back to top"
            >
                <FaArrowUp className="text-base" />
            </button>

            <footer className="bg-primary-light dark:bg-primary-dark border-t border-secondary-light/20 dark:border-secondary-dark/20 py-8 animate-fade-in">
                <div className="max-w-5xl mx-auto px-4 lg:px-8">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold mb-3 text-secondary-light dark:text-secondary-dark text-center">
                            Get In Touch
                        </h2>

                        <p className="text-center text-sm text-primary-dark dark:text-primary-light mb-6 max-w-2xl mx-auto">
                            Feel free to reach out through any of these platforms. I'm always open to discussing new projects, creative ideas, or opportunities.
                        </p>

                        {/* Fully clickable, smaller icons with gaps */}
                        <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-8">
                            {contacts.map((contact, index) => (
                                <a
                                    key={contact.link}
                                    href={contact.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`
                    relative w-12 h-12 flex items-center justify-center
                    ${contact.bg}
                    border border-accent-light/30 dark:border-accent-dark/30
                    rounded-md rotate-45
                    hover:rotate-0 hover:scale-110
                    transition-all duration-300
                    animate-fade-in
                    z-10
                  `}
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                    aria-label={`Contact via ${contact.icon.type.name.replace('Fa', '').replace('Si', '')}`}
                                >
                                    <span className={`-rotate-45 text-lg ${contact.color}`}>
                                        {contact.icon}
                                    </span>
                                    {/* Glow effect behind icon */}
                                    <span className="absolute inset-0 rounded-md blur-[2px] bg-accent-light/10 dark:bg-accent-dark/10"></span>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-secondary-light/30 to-transparent dark:via-secondary-dark/30 my-5"></div>

                    {/* Copyright */}
                    <div className="text-center">
                        <p className="text-xs text-secondary-light/80 dark:text-secondary-dark/80">
                            © {new Date().getFullYear()} All rights reserved.
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1.5">
                            Built with React & Tailwind CSS • Crafted with ❤️
                        </p>
                    </div>
                </div>
            </footer>
        </>
    );
}

export default Footer;