import React from "react";

export default function LabelAndValue({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode | string | number | null;
}) {
  return (
    <div>
      <p>
        <span className="font-bold text-lg">{label}: </span>
        <span className="text-lg">{value}</span>
      </p>
    </div>
  );
}
