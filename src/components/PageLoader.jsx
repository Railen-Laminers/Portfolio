// src/components/PageLoader.jsx
import React from "react";
import Loader from "./Loader";

const PageLoader = () => {
    return (
        <div className="max-w-5xl mx-auto px-4 lg:px-8 py-12 space-y-12">
            <Loader.ShimmerStyle />

            {/* About Skeleton */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-10">
                <Loader.Avatar size={240} />
                <div className="flex-1 space-y-4">
                    <Loader.Text lines={1} width="40%" />
                    <Loader.Text lines={2} />
                    <div className="flex flex-wrap gap-3">
                        {Array.from({ length: 7 }).map((_, i) => (
                            <Loader.Image key={i} width={40} height={40} rounded />
                        ))}
                    </div>
                </div>
            </div>

            {/* Projects Skeleton */}
            <div className="space-y-6">
                <Loader.Text lines={1} width="30%" />
                <Loader.Text lines={1} width="60%" />
                <div className="space-y-4">
                    {Array.from({ length: 2 }).map((_, catIdx) => (
                        <Loader.Container key={catIdx} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <Loader.Text lines={1} width="25%" className="mb-3" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {Array.from({ length: 3 }).map((_, projIdx) => (
                                    <div key={projIdx} className="space-y-2">
                                        <Loader.Image width="100%" height={100} className="w-full rounded-t" />
                                        <Loader.Text lines={1} width="80%" />
                                        <Loader.Text lines={1} width="40%" />
                                    </div>
                                ))}
                            </div>
                        </Loader.Container>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PageLoader;