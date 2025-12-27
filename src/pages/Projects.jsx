import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import DateComponent from "../components/DateComponent";
import maze from "../assets/SgamesImages/maze.png";
import uma from "../assets/SgamesImages/uma.png";
import ams from "../assets/SwebImages/ams.png";
import youtubeDownloader from "../assets/SwebImages/youtubeDownloader.png";

const projects = [
    {
        name: "Apartment Management System",
        date: "2025-11-15",
        category: "Web",
        image: ams,
        link: "https://github.com/Railen-Laminers/Apartment-Management.git",
    },
    {
        name: "Youtube Downloader",
        date: "2025-12-26",
        category: "Web",
        image: youtubeDownloader,
        link: "https://github.com/Railen-Laminers/YouTube_Downloader.git",
    },
    {
        name: "Maze Runner Game",
        date: "2025-12-21",
        category: "games",
        image: maze,
        link: "/maze-runner",
    },
    {
        name: "Uma (Unfinished)",
        date: "2025-12-25",
        category: "games",
        image: uma,
        link: "/Uma",
    },
];

function Projects() {
    const [openCategory, setOpenCategory] = useState(null);
    const contentRefs = useRef({}); // to store refs for each category

    const toggleCategory = (category) => {
        setOpenCategory(openCategory === category ? null : category);
    };

    const validProjects = projects.filter((p) => p && p.name && p.category);
    const categories = [...new Set(projects.map((p) => p.category).filter(Boolean))];
    const isExternalLink = (url) => /^https?:\/\//.test(url);

    return (
        <section
            id="projects"
            className="max-w-5xl mx-auto px-4 lg:px-8 py-12 animate-fade-in"
        >
            <h2 className="text-3xl font-bold mb-6 text-secondary-light dark:text-secondary-dark animate-slide-in">
                Projects
            </h2>

            <p className="text-lg mb-8 text-primary-dark dark:text-primary-light">
                Here are some of my featured works, grouped by category.
            </p>

            <div className="space-y-4">
                {categories.map((category, catIndex) => {
                    const categoryProjects = validProjects.filter(
                        (project) => project.category === category
                    );

                    return (
                        <div
                            key={category}
                            className="border border-accent-light/30 dark:border-accent-dark/30 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-md animate-fade-left"
                            style={{ animationDelay: `${catIndex * 0.2}s` }}
                        >
                            {/* Accordion header */}
                            <button
                                className="w-full text-left px-4 py-3 bg-primary-light/50 dark:bg-primary-dark/50 text-primary-dark dark:text-primary-light font-semibold flex justify-between items-center transition-colors duration-300 hover:bg-primary-light/70 dark:hover:bg-primary-dark/70"
                                onClick={() => toggleCategory(category)}
                            >
                                {category}
                                <span
                                    className={`text-lg transition-transform duration-300 ${openCategory === category ? "rotate-180" : ""
                                        }`}
                                >
                                    {openCategory === category ? "−" : "+"}
                                </span>
                            </button>

                            {/* Accordion content */}
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
                                <div
                                    className={`p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 transition-all duration-500 ease-in-out transform ${openCategory === category
                                            ? "opacity-100 translate-y-0"
                                            : "opacity-0 -translate-y-4"
                                        }`}
                                >
                                    {categoryProjects.length === 0 ? (
                                        <p className="col-span-full text-center text-primary-dark dark:text-primary-light">
                                            No projects in this category yet.
                                        </p>
                                    ) : (
                                        categoryProjects.map((project, i) => (
                                            <article
                                                key={i}
                                                className="rounded-lg overflow-hidden border border-secondary-light/20 dark:border-secondary-dark/20 shadow-sm bg-primary-light/30 dark:bg-primary-dark/30 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] animate-fade-left transform"
                                                style={{
                                                    animationDelay: `${i * 0.05 + 0.05}s`,
                                                }}
                                            >
                                                <div className="relative w-full h-32 sm:h-28 md:h-24 overflow-hidden rounded-t-lg group">
                                                    <img
                                                        src={project.image}
                                                        alt={project.name}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 group-hover:blur-sm"
                                                    />

                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                                                        {project.link &&
                                                            (isExternalLink(project.link) ? (
                                                                <a
                                                                    href={project.link}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-sm px-4 py-2 border border-accent-light dark:border-accent-dark text-accent-light dark:text-accent-dark rounded-md backdrop-blur-sm hover:bg-accent-light/10 dark:hover:bg-accent-dark/10 transition-all duration-300"
                                                                >
                                                                    View Project
                                                                </a>
                                                            ) : (
                                                                <Link
                                                                    to={project.link}
                                                                    className="text-sm px-4 py-2 border border-accent-light dark:border-accent-dark text-accent-light dark:text-accent-dark rounded-md backdrop-blur-sm hover:bg-accent-light/10 dark:hover:bg-accent-dark/10 transition-all duration-300"
                                                                >
                                                                    View Project
                                                                </Link>
                                                            ))}
                                                    </div>
                                                </div>

                                                <div className="p-2">
                                                    <h4 className="text-base font-semibold mb-1 text-secondary-light dark:text-secondary-dark">
                                                        {project.name}
                                                    </h4>
                                                    <DateComponent date={project.date} />
                                                </div>
                                            </article>
                                        ))
                                    )}
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
