import React from "react";
import clsx from "clsx";

const colorPalette = {
  green: { iconBg: "bg-green-100/80", icon: "text-green-600" },
  indigo: { iconBg: "bg-indigo-100/80", icon: "text-indigo-600" },
  violet: { iconBg: "bg-violet-100/80", icon: "text-violet-600" },
  red: { iconBg: "bg-red-100/80", icon: "text-red-600" },
  amber: { iconBg: "bg-amber-100/80", icon: "text-amber-600" },
  slate: { iconBg: "bg-slate-100/80", icon: "text-slate-600" },
};

export default function StatsCard({ title, value, subtitle, icon: Icon, color = "slate" }) {
  const palette = colorPalette[color] || colorPalette.slate;
  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
      <div className="flex items-center gap-4">
        {Icon && (
          <div className={clsx("p-3 rounded-2xl", palette.iconBg)}>
            <Icon className={clsx("w-5 h-5", palette.icon)} />
          </div>
        )}
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{title}</p>
          <p className="text-3xl font-semibold text-slate-900">{value}</p>
          {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
