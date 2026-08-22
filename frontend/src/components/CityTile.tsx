"use client";

import { useState } from "react";

/** Same city always gets the same gradient, so tiles look stable without any network. */
function hue(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

export default function CityTile({
  name, imageUrl, className = "h-24",
}: { name: string; imageUrl?: string | null; className?: string }) {
  const [loaded, setLoaded] = useState(false);
  const h = hue(name);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(135deg,
          hsl(${h} 55% 62%) 0%,
          hsl(${(h + 40) % 360} 60% 46%) 100%)`,
      }}
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
      {!loaded && (
        <span className="absolute inset-0 grid place-items-center text-2xl font-bold text-white/85">
          {name.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}
