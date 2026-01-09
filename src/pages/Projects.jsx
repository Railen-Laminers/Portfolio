import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import DateComponent from "../components/DateComponent";

// React Icons
import { FaLaravel, FaReact, FaGithub, FaNodeJs, FaJsSquare } from "react-icons/fa";
import { SiMysql, SiTailwindcss } from "react-icons/si";

const BASE = import.meta.env.BASE_URL || "/";
export const maze = `${BASE}assets/SgamesImages/Maze.png`;
export const uma = `${BASE}assets/SgamesImages/Uma.png`;
export const race = `${BASE}assets/SgamesImages/Race.png`;
export const ams = `${BASE}assets/SwebImages/Ams.png`;
export const youtubeDownloader = `${BASE}assets/SwebImages/YoutubeDownloader.png`;

const projects = [
    {
        name: "Apartment Management System (Private Repo)",
        date: "2025-11-15",
        category: "Web",
        image: ams,
        link: "https://github.com/Railen-Laminers/Apartment-Management.git",
        techStack: [
            { icon: <FaLaravel />, color: "text-red-500", name: "Laravel" },
            { icon: <FaReact />, color: "text-sky-400", name: "React" },
            { icon: <SiMysql />, color: "text-blue-500", name: "MySQL" },
            { icon: <SiTailwindcss />, color: "text-cyan-400", name: "Tailwind CSS" },
            { icon: <FaGithub />, color: "text-gray-800 dark:text-gray-200", name: "GitHub" },
        ],
    },
    {
        name: "Youtube Downloader",
        date: "2025-12-26",
        category: "Web",
        image: youtubeDownloader,
        link: "https://github.com/Railen-Laminers/YouTube_Downloader.git",
        techStack: [
            { icon: <FaNodeJs />, color: "text-green-500", name: "Node.js" },
            { icon: <FaReact />, color: "text-sky-400", name: "React" },
        ],
    },
    {
        name: "Maze Runner Game",
        date: "2025-12-21",
        category: "games",
        image: maze,
        link: "/maze-runner",
        techStack: [
            { icon: <FaReact />, color: "text-sky-400", name: "React" },
            { icon: <FaJsSquare />, color: "text-yellow-400", name: "Phaser.js" },
        ],
    },
    {
        name: "Uma",
        date: "2025-12-25",
        category: "games",
        image: uma,
        link: "/Uma",
        techStack: [
            { icon: <FaReact />, color: "text-sky-400", name: "React" },
            { icon: <FaJsSquare />, color: "text-yellow-400", name: "Phaser.js" },
        ],
    },
    {
        name: "Race",
        date: "2026-01-09",
        category: "games",
        image: race,
        link: "/race",
        techStack: [
            { icon: <FaReact />, color: "text-sky-400", name: "React" },
            { icon: <FaJsSquare />, color: "text-yellow-400", name: "Phaser.js" },
        ],
    },
];

function Projects() {
    const [openCategory, setOpenCategory] = useState(null);
    const contentRefs = useRef({});

    const toggleCategory = (category) => {
        setOpenCategory(openCategory === category ? null : category);
    };

    const validProjects = projects.filter((p) => p && p.name && p.category);
    const categories = [...new Set(validProjects.map((p) => p.category))];
    const isExternalLink = (url) => /^https?:\/\//.test(url);

    return (
        <section id="projects" className="max-w-5xl mx-auto px-4 lg:px-8 py-12 animate-fade-in">
            <h2 className="text-3xl font-bold mb-6 text-secondary-light dark:text-secondary-dark animate-slide-in">
                Projects
            </h2>

            <p className="text-lg mb-8 text-primary-dark dark:text-primary-light">
                Here are some of my featured works, grouped by category.
            </p>

            <div className="space-y-4">
                {categories.map((category) => {
                    const categoryProjects = validProjects.filter((p) => p.category === category);

                    return (
                        <div
                            key={category}
                            className="border border-accent-light/30 dark:border-accent-dark/30 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-md"
                        >
                            {/* Accordion Header */}
                            <button
                                className="w-full text-left px-4 py-3 bg-primary-light/50 dark:bg-primary-dark/50 text-primary-dark dark:text-primary-light font-semibold flex justify-between items-center"
                                onClick={() => toggleCategory(category)}
                            >
                                {category}
                                <span className="text-lg">{openCategory === category ? "−" : "+"}</span>
                            </button>

                            {/* Accordion Content */}
                            <div
                                ref={(el) => (contentRefs.current[category] = el)}
                                className="overflow-hidden transition-all duration-500 ease-in-out"
                                style={{
                                    maxHeight:
                                        openCategory === category
                                            ? `${contentRefs.current[category]?.scrollHeight}px`
                                            : "0",
                                }}
                            >
                                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {categoryProjects.map((project, i) => (
                                        <article
                                            key={i}
                                            className="rounded-lg overflow-hidden border border-accent-light/30 dark:border-accent-dark/30 shadow-sm bg-primary-light/30 dark:bg-primary-dark/30 hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
                                        >
                                            {/* Image */}
                                            <div className="relative w-full h-32 overflow-hidden group">
                                                <img
                                                    src={project.image}
                                                    alt={project.name}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 group-hover:blur-sm"
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {isExternalLink(project.link) ? (
                                                        <a
                                                            href={project.link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="px-4 py-2 border border-accent-light dark:border-accent-dark rounded-md text-accent-light dark:text-accent-dark"
                                                        >
                                                            View Project
                                                        </a>
                                                    ) : (
                                                        <Link
                                                            to={project.link}
                                                            className="px-4 py-2 border border-accent-light dark:border-accent-dark rounded-md text-accent-light dark:text-accent-dark"
                                                        >
                                                            View Project
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-3">
                                                <h4 className="font-semibold text-secondary-light dark:text-secondary-dark">
                                                    {project.name}
                                                </h4>

                                                <DateComponent date={project.date} />

                                                {/* Tech Stack with smaller colored icons */}
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {project.techStack.map((tech, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="relative w-6 h-6 flex items-center justify-center bg-primary-light/40 dark:bg-primary-dark/40 border border-accent-light/40 dark:border-accent-dark/40 rounded-md rotate-45 hover:rotate-0 hover:scale-105 transition-all duration-300 animate-fade-in"
                                                            style={{ animationDelay: `${0.05 + idx * 0.03}s` }}
                                                            title={tech.name}
                                                        >
                                                            <div className={`-rotate-45 text-sm ${tech.color}`}>{tech.icon}</div>
                                                            <span className="absolute inset-0 rounded-md blur-sm bg-accent-light/10 dark:bg-accent-dark/10"></span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

export default Projects;
