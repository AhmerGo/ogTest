module.exports = {
  purge: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        "blue-500": "#4299E1",
        "purple-500": "#9F7AEA",
        "gray-700": "#4A5568",
        "gray-900": "#1A202C",
      },
      boxShadow: {
        "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      },
      transform: {
        none: "none",
        "scale-0": "scale(0)",
        "scale-50": "scale(0.5)",
        "scale-75": "scale(0.75)",
        "scale-90": "scale(0.9)",
        "scale-95": "scale(0.95)",
        "scale-100": "scale(1)",
        "scale-105": "scale(1.05)",
        "scale-110": "scale(1.1)",
        "scale-125": "scale(1.25)",
        "scale-150": "scale(1.5)",
        "scale-200": "scale(2)",
      },
      transitionProperty: {
        none: "none",
        all: "all",
        default:
          "background-color, border-color, color, fill, stroke, opacity, box-shadow, transform",
        colors: "background-color, border-color, color, fill, stroke",
        opacity: "opacity",
        shadow: "box-shadow",
        transform: "transform",
      },
    },
  },
  variants: {
    extend: {
      textColor: ["responsive", "hover", "focus", "group-hover"],
      backgroundColor: ["responsive", "hover", "focus", "active"],
      borderColor: ["responsive", "hover", "focus", "active"],
      boxShadow: ["responsive", "hover", "focus", "active"],
      transform: ["responsive", "hover", "focus", "active", "group-hover"],
      translate: ["responsive", "hover", "focus", "active", "group-hover"],
      scale: ["responsive", "hover", "focus", "active", "group-hover"],
    },
  },
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        ".text-shadow": {
          textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)",
        },
      };
      addUtilities(newUtilities, ["responsive", "hover"]);
    },
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
    require("@tailwindcss/aspect-ratio"),
  ],
};
