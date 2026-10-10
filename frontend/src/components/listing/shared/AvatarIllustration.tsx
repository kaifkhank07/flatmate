"use client";

import React from "react";

interface AvatarIllustrationProps {
  type: "male1" | "female1" | "female2" | "female3" | "male2" | "female4";
  bg?: string;
  className?: string;
}

export default function AvatarIllustration({
  type,
  bg,
  className = "w-24 h-24 sm:w-28 sm:h-28",
}: AvatarIllustrationProps) {
  const getAvatarBg = () => {
    if (bg) return bg;
    switch (type) {
      case "male1":
      case "male2":
        return "#4585C5";
      case "female1":
      case "female4":
        return "#E83D55";
      case "female2":
        return "#E3B887";
      case "female3":
        return "#2B5F66";
      default:
        return "#4585C5";
    }
  };

  const currentBg = getAvatarBg();

  return (
    <div
      className={`overflow-hidden shrink-0 relative flex items-center justify-center ${className}`}
      style={{ backgroundColor: currentBg }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Background Circle */}
        <circle cx="50" cy="50" r="50" fill={currentBg} />

        {type === "male1" && (
          <g>
            {/* Body/Shirt */}
            <path
              d="M20 95C20 78 33 70 50 70C67 70 80 78 80 95V100H20V95Z"
              fill="#4A4A4A"
            />
            {/* Neck */}
            <rect x="43" y="56" width="14" height="18" fill="#E8A37E" />
            {/* Face */}
            <circle cx="50" cy="45" r="20" fill="#E8A37E" />
            {/* Beard */}
            <path
              d="M31 42C31 55 39 63 50 63C61 63 69 55 69 42H64C64 51 58 57 50 57C42 57 36 51 36 42H31Z"
              fill="#332B2B"
            />
            {/* Mouth */}
            <path
              d="M44 52C44 54 46.5 56 50 56C53.5 56 56 54 56 52"
              stroke="#332B2B"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Winking Eye (Left) */}
            <path
              d="M40 40C41.5 38 44.5 38 46 40"
              stroke="#222"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Normal Eye (Right) */}
            <circle cx="56" cy="39" r="2.5" fill="#222" />
            {/* Eyebrows */}
            <path
              d="M39 34C41 33 44 33 46 34"
              stroke="#332B2B"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M54 34C56 33 59 33 61 34"
              stroke="#332B2B"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Hair */}
            <path
              d="M30 40C28 28 36 20 50 20C64 20 72 28 70 40C66 32 60 26 50 26C40 26 34 32 30 40Z"
              fill="#332B2B"
            />
          </g>
        )}

        {type === "female1" && (
          <g>
            {/* Yellow Shirt */}
            <path
              d="M15 96C15 76 30 68 50 68C70 68 85 76 85 96V100H15V96Z"
              fill="#E5A800"
            />
            {/* White V-Collar */}
            <path d="M42 68L50 82L58 68H42Z" fill="#FFFFFF" />
            {/* Neck */}
            <rect x="43" y="54" width="14" height="18" fill="#FCD5B5" />
            {/* Face */}
            <circle cx="50" cy="44" r="19" fill="#FCD5B5" />
            {/* Eyes */}
            <circle cx="43" cy="42" r="2.2" fill="#2D2D2D" />
            <circle cx="57" cy="42" r="2.2" fill="#2D2D2D" />
            {/* Mouth */}
            <path
              d="M45 52C47 54 53 54 55 52"
              stroke="#D84B4B"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Long Dark Hair */}
            <path
              d="M30 42C28 24 38 18 50 18C62 18 72 24 70 42C72 58 70 78 68 85C66 85 64 70 64 54C60 48 54 46 50 46C46 46 40 48 36 54C36 70 34 85 32 85C30 78 28 58 30 42Z"
              fill="#2A2B36"
            />
          </g>
        )}

        {type === "female2" && (
          <g>
            {/* Pink Shirt */}
            <path
              d="M18 95C18 76 32 69 50 69C68 69 82 76 82 95V100H18V95Z"
              fill="#DC4364"
            />
            {/* Neck */}
            <rect x="43" y="55" width="14" height="18" fill="#FDDCB8" />
            {/* Face */}
            <circle cx="50" cy="45" r="19" fill="#FDDCB8" />
            {/* Glasses */}
            <circle
              cx="41"
              cy="43"
              r="7"
              stroke="#3D2B1F"
              strokeWidth="2"
              fill="none"
            />
            <circle
              cx="59"
              cy="43"
              r="7"
              stroke="#3D2B1F"
              strokeWidth="2"
              fill="none"
            />
            <line
              x1="48"
              y1="43"
              x2="52"
              y2="43"
              stroke="#3D2B1F"
              strokeWidth="2"
            />
            {/* Eyes behind glasses */}
            <circle cx="41" cy="43" r="2" fill="#3D2B1F" />
            <circle cx="59" cy="43" r="2" fill="#3D2B1F" />
            {/* Big Smile */}
            <path
              d="M43 53C45 57 55 57 57 53Z"
              fill="#FFFFFF"
              stroke="#3D2B1F"
              strokeWidth="1.5"
            />
            {/* Dark Hair with bangs */}
            <path
              d="M28 45C26 28 35 20 50 20C65 20 74 28 72 45C72 65 74 80 74 85H66C66 70 65 52 64 45C58 38 42 38 36 45C35 52 34 70 34 85H26C26 80 28 65 28 45Z"
              fill="#3D2B1F"
            />
          </g>
        )}

        {(type === "female3" || type === "female4") && (
          <g>
            {/* Dark Vest */}
            <path
              d="M18 96C18 76 32 68 50 68C68 68 82 76 82 96V100H18V96Z"
              fill="#30323A"
            />
            <path d="M44 68L50 84L56 68H44Z" fill="#FFFFFF" />
            {/* Neck */}
            <rect x="43" y="55" width="14" height="18" fill="#FCD5B5" />
            {/* Face */}
            <circle cx="50" cy="44" r="19" fill="#FCD5B5" />
            {/* Eyes */}
            <ellipse cx="43" cy="43" rx="2" ry="2.5" fill="#2D282A" />
            <ellipse cx="57" cy="43" rx="2" ry="2.5" fill="#2D282A" />
            {/* Red Lips */}
            <ellipse cx="50" cy="54" rx="4" ry="2" fill="#D83030" />
            {/* Dark Hair Ponytail */}
            <path
              d="M30 42C28 26 38 20 50 20C62 20 72 26 70 42C74 55 76 75 75 85H68C68 70 66 50 64 42C58 38 42 38 36 42C34 50 32 70 32 85H25C24 75 26 55 30 42Z"
              fill="#2D282A"
            />
          </g>
        )}
      </svg>
    </div>
  );
}
