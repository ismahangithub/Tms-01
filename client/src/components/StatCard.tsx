// src/components/StatCard.tsx

import React from "react";

interface StatCardProps {
  label: string;
  count: number | string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, count, color }) => {
  return (
    <div
      className={`p-6 rounded-lg ${color} shadow flex flex-col justify-center items-center transition-transform transform hover:scale-105`}
      style={{ minHeight: "150px" }}
    >
      <h3 className="text-4xl font-bold text-center">{count}</h3>
      <p className="text-center mt-2 text-lg">{label}</p>
    </div>
  );
};

export default StatCard;
