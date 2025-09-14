const yellow = {
  50: "#FFF8E5",
  100: "#FFEBBF",
  200: "#FFDE99",
  300: "#FFD273",
  400: "#FFC549",
  500: "#FFB900",
  600: "#CB940D",
  700: "#9A7111",
  800: "#6B4F11",
  900: "#40300E",
  950: "#1A1300",
};

const green = {
  50: "#F1FCE9",
  100: "#DDF3C9",
  200: "#C7EBAA",
  300: "#B2E28B",
  400: "#9AD96B",
  500: "#82CF49",
  600: "#66C61C",
  700: "#4F951B",
  800: "#386718",
  900: "#223C12",
  950: "#0C1603",
};

const blue = {
  50: "#E7F7FE",
  100: "#C9E6FB",
  200: "#AAD5F7",
  300: "#87C5F4",
  400: "#5EB5F0",
  500: "#0BA5EC",
  600: "#1484BC",
  700: "#15658F",
  800: "#134764",
  900: "#0E2B3C",
  950: "#011118",
};

const rose = {
  50: "#FEE7EC",
  100: "#FFC1C9",
  200: "#FF9BA7",
  300: "#FE7187",
  400: "#F63D68",
  500: "#CC3557",
  600: "#A42C47",
  700: "#7D2437",
  800: "#581B28",
  900: "#361219",
  950: "#180107",
};

const gray = {
  50: "#F2F2F2",
  100: "#D9D9D9",
  200: "#C0C0C0",
  300: "#A8A8A8",
  400: "#909090",
  500: "#797979",
  600: "#636363",
  700: "#46494F",
  800: "#393939",
  900: "#262626",
  950: "#0D0D0D",
};

const colors = {
  black: gray[900],
  white: "#FFFFFF",
  brand: {
    yellow: yellow[500],
    green: green[600],
    blue: blue[500],
    rose: rose[400],
    "deep-gray": gray[900],
  },
  error: {
    400: "#F04438",
  },
  success: {
    700: "#17B26A",
  },
  information: {
    600: "#175CD3",
  },
  yellow,
  green,
  blue,
  rose,
  gray,
};

const boxShadow = {
  exploration1: "0px 1px 20px -2px rgb(0 0 0 / 10%), 0 3px 10px -5px rgb(0 0 0 / 10%)",
  exploration2: "0px 32px 64px -12px rgb(0 0 0 / 14%), 5px -5px 8px -4px rgb(0 0 0 / 4%)",
  exploration3: "0px 4px 8px 0px rgb(0 0 0 / 8%)",
  exploration4: "4px 4px 80px 0px rgb(173 173 173 / 25%)",
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  plugins: [],
  theme: {
    colors: colors,
    boxShadow: boxShadow,
  },
};
