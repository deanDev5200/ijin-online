import type { SVGProps } from "react";

/**
 * Logo E-Dispen: buku terbuka dengan aksen centang persetujuan.
 * Ukuran bawaan 40x40 mengikuti viewBox svg; dapat diatur lewat className.
 */
export function EdispenLogo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <defs>
        <linearGradient
          id="edispenGrad"
          x1="0"
          y1="0"
          x2="40"
          y2="40"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#0EA5E9" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#edispenGrad)" />
      <path
        d="M10 15.5C10 14.6716 10.6716 14 11.5 14H17.5C18.8807 14 20 15.1193 20 16.5V27.5C20 26.6716 19.3284 26 18.5 26H11.5C10.6716 26 10 25.3284 10 24.5V15.5Z"
        stroke="white"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M30 15.5C30 14.6716 29.3284 14 28.5 14H22.5C21.1193 14 20 15.1193 20 16.5V27.5C20 26.6716 20.6716 26 21.5 26H28.5C29.3284 26 30 25.3284 30 24.5V15.5Z"
        stroke="white"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M15.5 19.5L18.5 22.5L25.5 15.5"
        stroke="#BAE6FD"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
