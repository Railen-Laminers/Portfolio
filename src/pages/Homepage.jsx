import Header from "../components/Header";
import About from "./About";
import Projects from "./Projects";
import Footer from "../components/Footer";

function Homepage() {
    return (
        <div className="min-h-screen bg-primary-light dark:bg-primary-dark text-secondary-dark dark:text-primary-light">
            <Header />
            <main>
                <About />
                <Projects />
            </main>
            <Footer />
        </div>
    );
}

export default Homepage;