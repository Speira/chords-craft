import { useId } from "react";

export const SimpleNote = ({ color = "#262626" }) => {
  const id = useId();
  const g1 = `${id}-gr1`;
  const g2 = `${id}-gr2`;
  const g3 = `${id}-gr3`;
  return (
    <svg width="40" height="40" viewBox="0 0 48 48" aria-hidden="true">
      <linearGradient
        id={g1}
        x1="7.253"
        x2="31.352"
        y1="24.253"
        y2="48.352"
        gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor={color} stopOpacity="0" />
        <stop offset="1" stopColor={color} stopOpacity=".8" />
      </linearGradient>
      <circle cx="18.5" cy="35.5" r="8.5" fill={`url(#${g1})`} />

      <linearGradient
        id={g2}
        x1="24"
        x2="24"
        y1="-21.113"
        y2="40.828"
        gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor={color} stopOpacity="0" />
        <stop offset="1" stopColor={color} stopOpacity=".8" />
      </linearGradient>
      <path
        fill={`url(#${g2})`}
        d="M27,4v31.5c0-0.11,0-0.23-0.01-0.34c-0.14-3.67-2.62-6.74-5.99-7.79V8c0-2.209,1.791-4,4-4H27z"
      />

      <linearGradient
        id={g3}
        x1="53.105"
        x2="22.55"
        y1="51.14"
        y2="-1.783"
        gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor={color} stopOpacity="0" />
        <stop offset="1" stopColor={color} stopOpacity=".8" />
      </linearGradient>
      <path
        fill={`url(#${g3})`}
        d="M36.5,30.16l-1.901-1.263c-1.645-1.092-2.227-3.218-1.412-5.017c1.979-4.365,0.06-6.256-2.996-9.271C29.13,13.57,27,11.7,27,11.7V4c0,0,4.107,3.09,7.4,6.34C38.29,14.18,43.62,19.43,36.5,30.16z"
      />
    </svg>
  );
};

export const NoteCredit = () => (
  <div
    dangerouslySetInnerHTML={{
      __html: "<!-- Icon Downloaded from https://icons8.com/ -->",
    }}
  />
);
