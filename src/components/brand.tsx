import type { ReactNode, SVGProps } from "react";

export function Wordmark({ className = "", tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <span className={`font-display whitespace-nowrap lowercase leading-none ${className}`}>
      <span className={tone === "dark" ? "text-cream" : "text-ink"}>aao </span>
      <span className="text-pink">baithein</span>
    </span>
  );
}

/** Wedding and truck-art flags: a row of pink, amber and mint triangles on a string. */
export function Bunting({ className = "" }: { className?: string }) {
  return (
    <svg className={`block h-7 w-full ${className}`} aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <pattern id="bunting" width="78" height="28" patternUnits="userSpaceOnUse">
          <path d="M0 3 L26 3 L13 24 Z" fill="#FF4D6D" />
          <path d="M26 3 L52 3 L39 24 Z" fill="#FFB703" />
          <path d="M52 3 L78 3 L65 24 Z" fill="#00C2A8" />
        </pattern>
      </defs>
      <line x1="0" y1="3" x2="100%" y2="3" stroke="#FFF8EC" strokeWidth="2" />
      <rect width="100%" height="28" fill="url(#bunting)" />
    </svg>
  );
}

export function ChaiMascot({ className = "", ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label="Chai cup mascot" {...rest}>
      <g fill="none" stroke="#FFF8EC" strokeWidth="5" strokeLinecap="round">
        <path d="M78 62 c-9 -9 9 -15 0 -26 c-6 -7 2 -12 4 -14" />
        <path d="M100 58 c-9 -10 9 -16 0 -28 c-6 -7 2 -12 4 -14" />
        <path d="M122 62 c-9 -9 9 -15 0 -26 c-6 -7 2 -12 4 -14" />
      </g>
      <ellipse cx="100" cy="172" rx="74" ry="13" fill="#FF4D6D" />
      <path d="M152 100 C186 100 186 146 146 146" fill="none" stroke="#FFB703" strokeWidth="11" strokeLinecap="round" />
      <path d="M42 80 L158 80 L147 158 Q145 168 134 168 L66 168 Q55 168 53 158 Z" fill="#FFB703" />
      <ellipse cx="100" cy="80" rx="59" ry="11" fill="#FFF8EC" />
      <ellipse cx="100" cy="81" rx="50" ry="7" fill="#C8742B" />
      <circle cx="80" cy="114" r="8" fill="#14110F" />
      <circle cx="120" cy="114" r="8" fill="#14110F" />
      <circle cx="82.5" cy="111" r="2.6" fill="#FFF8EC" />
      <circle cx="122.5" cy="111" r="2.6" fill="#FFF8EC" />
      <ellipse cx="67" cy="130" rx="8" ry="5" fill="#FF4D6D" />
      <ellipse cx="133" cy="130" rx="8" ry="5" fill="#FF4D6D" />
      <path d="M90 129 Q100 139 110 129" fill="none" stroke="#14110F" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

const ARCH_FILL = {
  pink: "bg-pink text-ink",
  mint: "bg-mint text-ink",
  amber: "bg-amber text-ink",
  dark: "bg-ink-card text-cream border-2 border-ink-line",
  cream: "bg-cream text-ink",
} as const;
export type ArchColor = keyof typeof ARCH_FILL;

/** Mughal arch window: rounded top, flat bottom. */
export function Arch({ color, className = "", children }: { color: ArchColor; className?: string; children?: ReactNode }) {
  return <div className={`arch ${ARCH_FILL[color]} ${className}`}>{children}</div>;
}

export function HunzaSunrise({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 220" className={className} aria-hidden="true" preserveAspectRatio="xMidYMax slice">
      <rect width="400" height="220" fill="#FFB703" />
      <circle cx="250" cy="105" r="46" fill="#FFF8EC" />
      <path d="M0 220 L0 150 L60 90 L105 135 L170 60 L235 140 L290 85 L350 135 L400 100 L400 220 Z" fill="#FF4D6D" />
      <path d="M170 60 L190 82 L178 80 L170 92 L160 78 L150 84 Z" fill="#FFF8EC" />
      <path d="M0 220 L0 185 L50 150 L95 182 L150 128 L215 190 L270 150 L320 182 L370 140 L400 160 L400 220 Z" fill="#14110F" />
    </svg>
  );
}

type Look = "dupatta" | "topi" | "glasses" | "curly";
const SKIN = { light: "#F2C9A0", medium: "#D9A06E", deep: "#9A6340", tan: "#C68A5A" } as const;

/** Simple flat local character for the audience arches. */
export function Character({
  look,
  skin = "medium",
  shirt = "#14110F",
  className = "",
}: {
  look: Look;
  skin?: keyof typeof SKIN;
  shirt?: string;
  className?: string;
}) {
  const s = SKIN[skin];
  return (
    <svg viewBox="0 0 120 140" className={className} aria-hidden="true">
      <path d="M18 140 Q18 96 60 94 Q102 96 102 140 Z" fill={shirt} />
      <rect x="51" y="78" width="18" height="20" rx="6" fill={s} />
      {look === "curly" && (
        <g fill="#14110F">
          {[34, 44, 54, 64, 74, 84].map((x, i) => (
            <circle key={x} cx={x} cy={38 + (i % 2) * 5} r="10" />
          ))}
          <circle cx="32" cy="54" r="8" />
          <circle cx="88" cy="54" r="8" />
        </g>
      )}
      {look === "dupatta" && <path d="M26 66 Q26 22 60 20 Q94 22 94 66 L100 140 L84 140 L80 70 Z" fill="#FF4D6D" />}
      <ellipse cx="60" cy="56" rx="25" ry="28" fill={s} />
      {look === "topi" && (
        <>
          <path d="M34 44 Q34 26 60 26 Q86 26 86 44 Z" fill="#FFF8EC" />
          <path d="M34 44 L86 44" stroke="#14110F" strokeWidth="2" />
        </>
      )}
      {look === "glasses" && (
        <>
          <path d="M35 46 Q36 26 60 26 Q86 26 85 46 Q74 34 60 36 Q46 34 35 46 Z" fill="#14110F" />
          <g fill="none" stroke="#14110F" strokeWidth="3">
            <circle cx="50" cy="58" r="8" />
            <circle cx="71" cy="58" r="8" />
            <path d="M58 58 L63 58" />
          </g>
        </>
      )}
      {look !== "glasses" && (
        <>
          <circle cx="51" cy="58" r="3" fill="#14110F" />
          <circle cx="69" cy="58" r="3" fill="#14110F" />
        </>
      )}
      <path d="M52 68 Q60 74 68 68" fill="none" stroke="#14110F" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

const ICON_PATHS = {
  peak: <path d="M3 26 L12 11 L17 18 L21 13 L29 26 Z M12 11 L14.5 15" />,
  chai: (
    <>
      <path d="M6 12 H24 L22 25 Q21.5 27 19.5 27 H10.5 Q8.5 27 8 25 Z" />
      <path d="M24 15 Q29 15 28 19 Q27 22 23 22" />
      <path d="M12 8 Q10 6 12 4 M18 8 Q16 6 18 4" />
    </>
  ),
  talk: <path d="M5 7 H27 Q28 7 28 8 V20 Q28 21 27 21 H14 L8 26 V21 H5 Q4 21 4 20 V8 Q4 7 5 7 Z" />,
  compass: (
    <>
      <circle cx="16" cy="16" r="12" />
      <path d="M20 12 L18 18 L12 20 L14 14 Z" />
    </>
  ),
  seat: <path d="M4 15 H28 M6 15 V25 M26 15 V25 M4 20 H28 M8 15 V9 Q8 7 10 7 H22 Q24 7 24 9 V15" />,
  briefcase: (
    <>
      <rect x="4" y="10" width="24" height="16" rx="2" />
      <path d="M12 10 V7 Q12 6 13 6 H19 Q20 6 20 7 V10 M4 17 H28" />
    </>
  ),
} as const;
export type IconName = keyof typeof ICON_PATHS;

export function BrandIcon({ name, className = "h-8 w-8" }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

export function IconTile({ name, color = "pink" }: { name: IconName; color?: "pink" | "dark" }) {
  return (
    <span
      className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${
        color === "pink" ? "bg-pink text-cream" : "bg-ink text-cream"
      }`}
    >
      <BrandIcon name={name} className="h-7 w-7" />
    </span>
  );
}
