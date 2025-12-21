import {
    FaReact,
    FaJsSquare,
    FaNodeJs,
    FaBootstrap,
    FaJava,
    FaGithub,
    FaDatabase
} from "react-icons/fa";
import { SiLaravel, SiMysql, SiTailwindcss } from "react-icons/si";

function About() {
    const techStack = [
        { name: "", icon: <FaReact className="text-blue-400" /> },
        { name: "", icon: <FaJsSquare className="text-yellow-400" /> },   
        { name: "", icon: <SiLaravel className="text-red-600" /> },
        { name: "", icon: <SiTailwindcss className="text-teal-400" /> },
        { name: "", icon: <FaBootstrap className="text-purple-600" /> },
        { name: "", icon: <SiMysql className="text-blue-600 dark:text-blue-400" /> },
        { name: "", icon: <FaGithub className="text-gray-800 dark:text-gray-100" /> },
    ];

    return (
        <section
            id="about"
            className="max-w-5xl mx-auto px-4 lg:px-8 py-12 animate-fade-in"
        >
            <h2 className="text-3xl font-bold mb-8 text-secondary-light dark:text-secondary-dark animate-slide-in">
                About Me
            </h2>

            <div className="flex flex-col md:flex-row items-start gap-8">
                {/* Image / Avatar */}
                <div
                    className="w-40 h-40 bg-primary-light/70 dark:bg-primary-dark/70
                     border border-secondary-light/30 dark:border-secondary-dark/30
                     flex items-center justify-center rounded-lg animate-scale-up hover:scale-105 transition-transform duration-300"
                >
                    <span className="text-sm text-secondary-light dark:text-secondary-dark">
                        Image Placeholder
                    </span>
                </div>

                {/* Info */}
                <div className="animate-slide-in" style={{ animationDelay: "0.1s" }}>
                    <h3 className="text-2xl font-semibold mb-2 text-secondary-light dark:text-secondary-dark">
                        Railen Cype Laminero
                    </h3>

                    <p className="text-sm mb-2 text-primary-dark dark:text-primary-light">
                        Age: 21
                    </p>

                    <p className="text-lg mb-4 text-primary-dark dark:text-primary-light">
                        I am a developer passionate about games, web, and UI design.
                    </p>

                    <div className="flex flex-wrap gap-3">
                        {techStack.map((tech, index) => (
                            <div
                                key={tech.name}
                                className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-primary-light/30 dark:bg-primary-dark/30
                           border-secondary-light/30 dark:border-secondary-dark/30 transition-all duration-300 
                           hover:scale-105 hover:bg-primary-light/50 dark:hover:bg-primary-dark/50 animate-fade-in"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                {tech.icon}
                                {/* <span className="text-sm text-secondary-light dark:text-secondary-dark">
                                    {tech.name}
                                </span> */}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default About;