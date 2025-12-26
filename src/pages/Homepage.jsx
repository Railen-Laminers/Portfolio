// src/pages/Homepage.jsx
import React, { Suspense } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import PageLoader from "../components/PageLoader";

const About = React.lazy(() => import("./About"));
const Projects = React.lazy(() => import("./Projects"));

function Homepage() {
    return (
        <div className="min-h-screen bg-primary-light dark:bg-primary-dark text-secondary-dark dark:text-primary-light">
            <Header />
            <main>
                <Suspense fallback={<PageLoader />}>
                    <About />
                    <Projects />
                </Suspense>
            </main>
            <Footer />
        </div>
    );
}

export default Homepage;