// src/components/DateComponent.jsx
import React from "react";

function DateComponent({ date }) {
    const formattedDate = new Date(date).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return <p className="text-sm mb-2 text-primary-dark dark:text-primary-light">{formattedDate}</p>;
}

export default DateComponent;
