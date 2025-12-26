// src/components/Loader.jsx
import React from "react";

// Shimmer animation styles (light & dark mode compatible)
const ShimmerStyle = () => (
  <style>{`
    @keyframes shimmer {
      0% { background-position: -1000px 0; }
      100% { background-position: 1000px 0; }
    }
    .skeleton-shimmer {
      background: linear-gradient(
        90deg,
        rgba(229, 231, 235, 0.8),
        rgba(243, 244, 246, 0.9),
        rgba(229, 231, 235, 0.8)
      );
      background-size: 1000px 100%;
      animation: shimmer 1.8s infinite linear;
    }
    .dark .skeleton-shimmer {
      background: linear-gradient(
        90deg,
        rgba(55, 65, 81, 0.8),
        rgba(75, 85, 99, 0.9),
        rgba(55, 65, 81, 0.8)
      );
    }
  `}</style>
);

// --- Components ---
const Text = ({ lines = 1, width = "100%", className = "" }) => (
  <div className="space-y-2">
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className="bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
        style={{
          width: Array.isArray(width) ? width[i % width.length] : width,
          height: "1rem",
        }}
      />
    ))}
  </div>
);

const Image = ({ width, height, rounded = false, className = "", ...props }) => (
  <div
    className={`skeleton-shimmer ${rounded ? 'rounded-full' : 'rounded-md'} ${className}`}
    style={{ width, height }}
    {...props}
  />
);

const Avatar = ({ size = 48, className = "", ...props }) => (
  <Image width={size} height={size} rounded className={className} {...props} />
);

const Container = ({ children, className = "", ...props }) => (
  <div className={`bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`} {...props}>
    {children}
  </div>
);

// Export as named components + utility
const Loader = {
  Text,
  Image,
  Avatar,
  Container,
  ShimmerStyle,
};

export default Loader;