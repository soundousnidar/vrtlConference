import React from "react";

interface InfoBoxProps {
  title: string;
  value: number | string;
  color: string;
}

const InfoBox: React.FC<InfoBoxProps> = ({ title, value, color }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow border-l-4" style={{ borderColor: color }}>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-4xl" style={{ color: color }}>{value}</p>
    </div>
  );
};

export default InfoBox;
