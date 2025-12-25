import {
  FaReact,
  FaJsSquare,
  FaBootstrap,
  FaGithub,
} from "react-icons/fa";
import { SiLaravel, SiMysql, SiTailwindcss } from "react-icons/si";
import profile from "../assets/profile.jpg";

function About() {
  const techStack = [
    { icon: <FaReact />, color: "text-sky-400" },
    { icon: <FaJsSquare />, color: "text-yellow-400" },
    { icon: <SiLaravel />, color: "text-red-500" },
    { icon: <SiTailwindcss />, color: "text-cyan-400" },
    { icon: <FaBootstrap />, color: "text-purple-500" },
    { icon: <SiMysql />, color: "text-blue-500" },
    { icon: <FaGithub />, color: "text-gray-800 dark:text-gray-200" },
  ];

  return (
    <section
      id="about"
      className="
        max-w-5xl mx-auto px-4 lg:px-8 py-12
        bg-primary-light dark:bg-primary-dark
      "
    >
      <div className="flex flex-col md:flex-row items-start md:items-center gap-10">

        {/* Profile Card */}
        <div
          className="
            w-60 h-60 flex-shrink-0 flex flex-col
            bg-primary-light dark:bg-primary-dark
             overflow-hidden
            animate-fade-left
          "
          style={{ animationDelay: "0.1s" }}
        >
          <div
            className="
              flex-[7] flex items-center justify-center
              rounded-md
              rotate-45
              hover:animate-blur-pulse
              relative overflow-hidden
              [clip-path:polygon(0_0,100%_0,100%_100%,15%_100%,0_85%)]
            "
          >
            <img
              src={profile}
              alt="Railen Cype Laminero"
              className="
                w-full h-full object-cover -rotate-45
                border-2 border-accent-light dark:border-accent-dark rounded-md
              "
            />
          </div>

          {/* Name – 30% */}
          <div className="flex-[3] flex items-center justify-center p-1 text-xs text-primary-dark dark:text-primary-light">
            <p className="font-bold text-center">RAILEN CYPE LAMINERO</p>
          </div>
        </div>

        {/* Content */}
        <div
          className="flex-1 animate-fade-right"
          style={{ animationDelay: "0.2s" }}
        >
          <h3 className="text-2xl font-semibold mb-2 text-secondary-light dark:text-secondary-dark">
            Profile
          </h3>

          <p className="text-sm mb-2 text-primary-dark dark:text-primary-light">
            Age: 21
          </p>

          <p className="text-lg mb-6 text-primary-dark dark:text-primary-light">
            I am a developer passionate about games, web development, and
            immersive UI design. I enjoy turning interfaces into experiences.
          </p>

          {/* Tech Stack */}
          <div className="flex flex-wrap gap-3">
            {techStack.map((tech, index) => (
              <div
                key={index}
                className="
        relative w-10 h-10 flex items-center justify-center
        bg-primary-light/40 dark:bg-primary-dark/40
        border-2 border-accent-light/40 dark:border-accent-dark/40
        rounded-md rotate-45
        hover:rotate-0 hover:scale-110
        transition-all duration-300
        animate-fade-in
      "
                style={{ animationDelay: `${0.3 + index * 0.1}s` }}
              >
                <div className={`-rotate-45 text-lg ${tech.color}`}>
                  {tech.icon}
                </div>
                <span className="absolute inset-0 rounded-md blur-sm bg-accent-light/10 dark:bg-accent-dark/10"></span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}

export default About;
