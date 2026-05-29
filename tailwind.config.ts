import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0B1020",
        surface: "#151B2F",
        "surface-raised": "#1F2942",
        "primary-purple": "#8B5CF6",
        "glow-lavender": "#C4B5FD",
        "electric-cyan": "#22D3EE",
        "success-green": "#22C55E",
        "warning-amber": "#F59E0B",
        "danger-coral": "#F87171",
        "text-main": "#F8FAFC",
        "text-muted": "#94A3B8",
      },
      animation: {
        gradient: "gradientShift 12s ease infinite",
        "glow-pulse": "glowPulse 2.5s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        "spin-slow": "spin 8s linear infinite",
        "bounce-soft": "bounceSoft 1.5s ease-in-out infinite",
        "fade-in": "fadeIn 0.5s ease forwards",
        "slide-up": "slideUp 0.4s ease forwards",
        "scale-in": "scaleIn 0.3s ease forwards",
        victory: "victory 0.6s ease forwards",
      },
      keyframes: {
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        glowPulse: {
          "0%, 100%": {
            boxShadow:
              "0 0 5px rgba(139,92,246,0.3), 0 0 10px rgba(139,92,246,0.2)",
          },
          "50%": {
            boxShadow:
              "0 0 20px rgba(139,92,246,0.8), 0 0 40px rgba(139,92,246,0.4), 0 0 60px rgba(139,92,246,0.2)",
          },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        bounceSoft: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        victory: {
          "0%": { transform: "scale(0.8) rotate(-5deg)", opacity: "0" },
          "60%": { transform: "scale(1.1) rotate(2deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      backgroundSize: {
        "200%": "200% 200%",
        "400%": "400% 400%",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
