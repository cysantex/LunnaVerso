import { useEffect, useState } from "react";

interface Particle {
  id: number;
  type: "petal" | "sparkle" | "butterfly";
  size: number;
  left: number;
  delay: number;
  duration: number;
  horizontalShift: number;
  color?: string;
}

export default function FloatingParticles() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const generated: Particle[] = Array.from({ length: 32 }).map((_, i) => {
      // 0 to 18: petal, 19 to 27: sparkle, 28 to 31: butterfly
      let type: "petal" | "sparkle" | "butterfly" = "petal";
      const rand = Math.random();
      if (rand < 0.5) {
        type = "petal";
      } else if (rand < 0.85) {
        type = "sparkle";
      } else {
        type = "butterfly";
      }

      const colors = ["#fca5a5", "#fde047", "#c084fc", "#fda4af"];
      const wingColor = colors[Math.floor(Math.random() * colors.length)];

      return {
        id: i,
        type,
        size: type === "petal" ? Math.random() * 16 + 10 : type === "butterfly" ? 32 : Math.random() * 6 + 4,
        left: Math.random() * 95, // percentage
        delay: Math.random() * -20, // negative delay so they start pre-distributed
        duration: type === "butterfly" ? Math.random() * 12 + 16 : Math.random() * 8 + 12, // butterflies float slower and gracefully
        horizontalShift: Math.random() * 60 - 30, // pixel drift
        color: type === "butterfly" ? wingColor : undefined,
      };
    });
    setParticles(generated);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {particles.map((p) => {
        if (p.type === "petal") {
          return (
            <svg
              key={p.id}
              className="absolute animate-fall"
              style={{
                left: `${p.left}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
                opacity: 0.6,
              }}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2C11.5 5 8 9 5 12C2 15 2 18 5 20C8 22 11 20 12 17C13 20 16 22 19 20C22 18 22 15 19 12C16 9 12.5 5 12 2Z"
                fill="#fca5a5" // soft light red/pink
                fillOpacity="0.45"
              />
            </svg>
          );
        } else if (p.type === "butterfly") {
          // Unique IDs for gradients to prevent collision between floating particles
          const gradForeLeftId = `butterfly-fore-left-${p.id}`;
          const gradHindLeftId = `butterfly-hind-left-${p.id}`;
          const gradForeRightId = `butterfly-fore-right-${p.id}`;
          const gradHindRightId = `butterfly-hind-right-${p.id}`;
          
          // Determine beautiful matching accent colors for the organic gradients
          const baseColor = p.color || "#fda4af";
          // Create sunset orange if color is pink, or rose pink if color is yellow/amber, violet/indigo for purple
          let accentColor = "#fef08a"; // default soft amber
          if (baseColor === "#fde047") {
            accentColor = "#fda4af"; // yellow -> rose
          } else if (baseColor === "#c084fc") {
            accentColor = "#fda4af"; // purple -> rose
          } else if (baseColor === "#fca5a5" || baseColor === "#fda4af") {
            accentColor = "#fbbf24"; // rose -> amber/gold
          }

          return (
            <div
              key={p.id}
              className="butterfly-container absolute"
              style={{
                left: `${p.left}%`,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
              }}
            >
              <div className="butterfly">
                {/* Left Wing with flowing natural watercolor bezier paths */}
                <div className="butterfly-wing-left">
                  <svg viewBox="0 0 30 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id={gradForeLeftId} x1="30" y1="20" x2="5" y2="10" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor={baseColor} stopOpacity="0.95" />
                        <stop offset="100%" stopColor={accentColor} stopOpacity="0.75" />
                      </linearGradient>
                      <linearGradient id={gradHindLeftId} x1="30" y1="20" x2="15" y2="35" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor={baseColor} stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#ffffff" stopOpacity="0.6" />
                      </linearGradient>
                    </defs>
                    {/* Forewing */}
                    <path
                      d="M 30,20 C 30,20 20,2 6,8 C -3,14 1,23 16,23 C 24,23 28,21 30,20 Z"
                      fill={`url(#${gradForeLeftId})`}
                    />
                    {/* Inner glowing core accent */}
                    <path
                      d="M 28,19 C 28,19 20,6 10,11 C 4,15 7,20 18,20 C 24,20 27,20 28,19 Z"
                      fill="#ffffff"
                      fillOpacity="0.25"
                    />
                    {/* Hindwing */}
                    <path
                      d="M 30,22 C 26,23 12,24 16,34 C 20,40 28,36 30,26 Z"
                      fill={`url(#${gradHindLeftId})`}
                    />
                  </svg>
                </div>
                
                {/* Right Wing with symmetrical mirrored flowing watercolor path */}
                <div className="butterfly-wing-right">
                  <svg viewBox="0 0 30 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id={gradForeRightId} x1="0" y1="20" x2="25" y2="10" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor={baseColor} stopOpacity="0.95" />
                        <stop offset="100%" stopColor={accentColor} stopOpacity="0.75" />
                      </linearGradient>
                      <linearGradient id={gradHindRightId} x1="0" y1="20" x2="15" y2="35" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor={baseColor} stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#ffffff" stopOpacity="0.6" />
                      </linearGradient>
                    </defs>
                    {/* Forewing */}
                    <path
                      d="M 0,20 C 0,20 10,2 24,8 C 33,14 29,23 14,23 C 6,23 2,21 0,20 Z"
                      fill={`url(#${gradForeRightId})`}
                    />
                    {/* Inner glowing core accent */}
                    <path
                      d="M 2,19 C 2,19 10,6 20,11 C 26,15 23,20 12,20 C 6,20 3,20 2,19 Z"
                      fill="#ffffff"
                      fillOpacity="0.25"
                    />
                    {/* Hindwing */}
                    <path
                      d="M 0,22 C 4,23 18,24 14,34 C 10,40 2,36 0,26 Z"
                      fill={`url(#${gradHindRightId})`}
                    />
                  </svg>
                </div>

                {/* Sleek, abstract, high-fashion corporate body profile featuring delicate elegant antennae */}
                <div className="absolute left-[50%] top-0 -translate-x-[50%] w-[12px] h-[40px] pointer-events-none z-10 flex items-center justify-center">
                  <svg viewBox="0 0 12 40" className="w-[12px] h-[40px] overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Sleek thin antenna curves */}
                    <path d="M 6,18 C 5,11 1,7 -3,9" stroke="#4b5563" strokeWidth="0.85" strokeLinecap="round" fill="none" />
                    <path d="M 6,18 C 7,11 11,7 15,9" stroke="#4b5563" strokeWidth="0.85" strokeLinecap="round" fill="none" />
                    {/* Dainty luminous guides at tips */}
                    <circle cx="-3" cy="9" r="0.6" fill="#fef08a" />
                    <circle cx="15" cy="9" r="0.6" fill="#fef08a" />
                    
                    {/* Clean stylized minimalist head and body segments in premium neutral/charcoal */}
                    <circle cx="6" cy="18" r="1.2" fill="#374151" />
                    <ellipse cx="6" cy="24" rx="1" ry="4" fill="#1f2937" />
                    <ellipse cx="6" cy="24" rx="0.4" ry="2.5" fill="#ffffff" fillOpacity="0.3" />
                  </svg>
                </div>
              </div>
            </div>
          );
        } else {
          return (
            <div
              key={p.id}
              className="absolute animate-fall bg-amber-200 rounded-full blur-[1px] shadow-[0_0_8px_#fde047]"
              style={{
                left: `${p.left}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
                opacity: 0.5,
              }}
            />
          );
        }
      })}
    </div>
  );
}
