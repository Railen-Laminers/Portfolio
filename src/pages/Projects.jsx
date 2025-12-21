import React, { useState } from "react";
import DateComponent from "../components/DateComponent";

// Example projects array with some empty objects
const projects = [
    {
        name: "Apartment Management System",
        date: "2024-01-15",
        category: "Web",
        image: "https://via.placeholder.com/600x400",
        link: "https://github.com/Railen-Laminers/Apartment-Management.git",
    },
    { category: "games" },
    { category: "app" },
];

function Projects() {
    const [openCategory, setOpenCategory] = useState(null);

    const toggleCategory = (category) => {
        setOpenCategory(openCategory === category ? null : category);
    };

    // Filter valid projects (those with a name)
    const validProjects = projects.filter((p) => p && p.name && p.category);

    // Extract **all categories** from all projects (even empty ones)
    const categories = [...new Set(projects.map((p) => p.category).filter(Boolean))];

    // If no projects at all
    if (projects.length === 0 || categories.length === 0) {
        return (
            <section
                id="projects"
                className="max-w-5xl mx-auto px-4 lg:px-8 py-12 animate-fade-in"
            >
                <h2 className="text-3xl font-bold mb-6 text-secondary-light dark:text-secondary-dark animate-slide-in">
                    Projects
                </h2>
                <p className="text-lg text-primary-dark dark:text-primary-light text-center">
                    No projects available at the moment.
                </p>
            </section>
        );
    }

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
                {categories.map((category) => {
                    // Get valid projects for this category
                    const categoryProjects = validProjects.filter(
                        (project) => project.category === category
                    );

                    return (
                        <div
                            key={category}
                            className="border border-accent-light/30 dark:border-accent-dark/30 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-md"
                        >
                            <button
                                className="w-full text-left px-4 py-3 bg-primary-light/50 dark:bg-primary-dark/50 text-primary-dark dark:text-primary-light font-semibold flex justify-between items-center transition-colors duration-300 hover:bg-primary-light/70 dark:hover:bg-primary-dark/70"
                                onClick={() => toggleCategory(category)}
                            >
                                {category}
                                <span className="text-lg transition-transform duration-300">
                                    {openCategory === category ? "−" : "+"}
                                </span>
                            </button>

                            <div
                                className={`overflow-hidden transition-all duration-300 ease-in-out ${openCategory === category
                                    ? "max-h-[1000px]"
                                    : "max-h-0"
                                    }`}
                            >
                                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {categoryProjects.length === 0 ? (
                                        <p className="col-span-full text-center text-primary-dark dark:text-primary-light">
                                            No projects in this category yet.
                                        </p>
                                    ) : (
                                        categoryProjects.map((project, i) => (
                                            <article
                                                key={i}
                                                className="rounded-lg overflow-hidden border border-secondary-light/20 dark:border-secondary-dark/20 shadow-sm bg-primary-light/30 dark:bg-primary-dark/30 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] animate-fade-in"
                                                style={{
                                                    animationDelay: `${i * 0.1}s`,
                                                }}
                                            >
                                                <div className="w-full h-24 bg-gradient-to-br from-blue-400/20 to-purple-400/20 overflow-hidden">
                                                    <img
                                                        src={project.image}
                                                        alt={project.name}
                                                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                                                    />
                                                </div>
                                                <div className="p-3">
                                                    <h4 className="text-lg font-semibold mb-1 text-secondary-light dark:text-secondary-dark">
                                                        {project.name}
                                                    </h4>
                                                    <DateComponent date={project.date} />
                                                    <a
                                                        href={project.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-block mt-2 text-sm border border-accent-light dark:border-accent-dark text-primary-dark dark:text-primary-light px-3 py-1 rounded-md transition-all duration-300 hover:bg-accent-light/10 dark:hover:bg-accent-dark/10 hover:scale-105"
                                                    >
                                                        View Project
                                                    </a>
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
