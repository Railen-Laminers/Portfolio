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

    // Show back-to-top button when scrolling down
    useEffect(() => {
        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 300);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    const contacts = [
        {
            icon: <FaFacebook />,
            link: "https://facebook.com/yourprofile",
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-500/10 dark:bg-blue-400/10",
            hover: "hover:bg-blue-500/20 dark:hover:bg-blue-400/20",
        },
        {
            icon: <FaEnvelope />,
            link: "mailto:your.email@example.com",
            color: "text-red-600 dark:text-red-400",
            bg: "bg-red-500/10 dark:bg-red-400/10",
            hover: "hover:bg-red-500/20 dark:hover:bg-red-400/20",
        },
        {
            icon: <FaTelegramPlane />,
            link: "https://t.me/yourusername",
            color: "text-blue-500 dark:text-blue-300",
            bg: "bg-blue-500/10 dark:bg-blue-300/10",
            hover: "hover:bg-blue-500/20 dark:hover:bg-blue-300/20",
        },
        {
            icon: <FaGithub />,
            link: "https://github.com/yourusername",
            color: "text-gray-700 dark:text-gray-300",
            bg: "bg-gray-500/10 dark:bg-gray-700/10",
            hover: "hover:bg-gray-500/20 dark:hover:bg-gray-700/20",
        },
    ];

    return (
        <>
            {/* Back to Top Button */}
            <button
                onClick={scrollToTop}
                className={`fixed bottom-6 right-6 md:bottom-8 md:right-8 bg-accent-light dark:bg-accent-dark text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-40 
          ${showBackToTop
                        ? "translate-y-0 opacity-100 scale-100"
                        : "translate-y-10 opacity-0 scale-90 pointer-events-none"
                    }`}
                aria-label="Back to top"
            >
                <FaArrowUp className="text-lg" />
            </button>

            <footer className="bg-primary-light dark:bg-primary-dark border-t border-secondary-light/20 dark:border-secondary-dark/20 py-8 animate-fade-in">
                <div className="max-w-5xl mx-auto px-4 lg:px-8">
                    {/* Contact Section */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold mb-4 text-secondary-light dark:text-secondary-dark text-center">
                            Get In Touch
                        </h2>

                        <p className="text-center text-primary-dark dark:text-primary-light mb-6 max-w-2xl mx-auto">
                            Feel free to reach out through any of these platforms. I'm always
                            open to discussing new projects, creative ideas, or opportunities.
                        </p>

                        <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-8">
                            {contacts.map((contact, index) => (
                                <a
                                    key={contact.link} // ✅ FIXED KEY
                                    href={contact.link}z
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full
                    ${contact.bg} ${contact.color}
                    transition-all duration-300 hover:scale-110 ${contact.hover} animate-scale-up group`}
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <span className="text-xl md:text-2xl transition-transform duration-300 group-hover:scale-125">
                                        {contact.icon}
                                    </span>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-secondary-light/30 to-transparent dark:via-secondary-dark/30 my-6"></div>

                    {/* Copyright */}
                    <div className="text-center">
                        <p className="text-sm text-secondary-light/80 dark:text-secondary-dark/80">
                            © {new Date().getFullYear()} All rights reserved.
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Built with React & Tailwind CSS • Crafted with ❤️
                        </p>
                    </div>
                </div>
            </footer>
        </>
    );
}

export default Footer;
