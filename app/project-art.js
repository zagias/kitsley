'use client';

import { useId } from 'react';

export default function ProjectArt() {
  const accent = useId();
  return <svg viewBox="0 0 560 480" role="img" aria-label="Exploded bookcase design in light natural wood, with a measuring square, clamp and colourful dimension guides">
    <defs>
      <linearGradient id={accent} x1="80" y1="420" x2="470" y2="60" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2563EB"/><stop offset=".4" stopColor="#7C3AED"/><stop offset=".7" stopColor="#DB2777"/><stop offset="1" stopColor="#F97316"/>
      </linearGradient>
    </defs>
    <rect width="560" height="480" fill="#f7f7f8"/>
    <g fontFamily="system-ui" fill="#52525b"><text x="30" y="36" fontSize="11" letterSpacing="1.8">PROJECT PREVIEW</text><text x="530" y="36" textAnchor="end" fontSize="11">01 / BOOKCASE</text></g>
    <ellipse cx="293" cy="432" rx="159" ry="13" fill="#e9e9ed"/>
    <g stroke="#414047" strokeWidth="1.5" strokeLinejoin="round" transform="translate(0 -10)">
      <path d="M145 145L302 111V385L145 420Z" fill="#ead3af"/>
      <path d="M145 145L159 152V427L145 420Z" fill="#c7a77d"/>
      <path d="M302 111L316 119V394L302 385Z" fill="#d3b58e"/>
      <path d="M215 161L383 124L416 143L247 181Z" fill="#f5e6ce"/>
      <path d="M247 181L416 143V155L247 194Z" fill="#d3b58e"/>
      <path d="M189 252L356 215L390 234L222 272Z" fill="#f5e6ce"/>
      <path d="M222 272L390 234V246L222 285Z" fill="#d3b58e"/>
      <path d="M189 337L356 300L390 319L222 357Z" fill="#f5e6ce"/>
      <path d="M222 357L390 319V331L222 370Z" fill="#d3b58e"/>
      <path d="M386 204L404 214V427L386 416Z" fill="#c7a77d"/>
      <path d="M404 214L428 207V420L404 427Z" fill="#ead3af"/>
      <g stroke="#bfa27c" strokeWidth=".65" opacity=".5"><path d="M175 168V395M181 190V354M281 137V373M410 230V398" fill="none"/></g>
    </g>
    <g stroke={`url(#${accent})`} strokeWidth="1.5" fill="none">
      <path d="M116 132V410M110 132H122M110 410H122M153 446L430 446M153 440V452M430 440V452"/>
      <path d="M169 149L211 166M320 112L377 129M375 215V407" strokeDasharray="4 6" opacity=".7"/>
      <circle cx="116" cy="132" r="3" fill="#f7f7f8"/><circle cx="430" cy="446" r="3" fill="#f7f7f8"/>
    </g>
    <g transform="translate(322 64)"><rect width="194" height="34" rx="17" fill="white" stroke="#e4e4e7"/><path d="m14 17 4 4 7-8" fill="none" stroke="#7C3AED" strokeWidth="1.7" strokeLinecap="round"/><text x="35" y="22" fill="#3f3f46" fontSize="12" fontFamily="system-ui">Sized for your space</text></g>
    <g transform="translate(58 335) rotate(-9)" stroke="#52525b" strokeWidth="1.4" strokeLinejoin="round"><path d="M0 0H14V61H61V75H0Z" fill="#e1e1e5"/><path d="M4 12H10M4 24H10M4 36H10M4 48H10M22 65V71M34 65V71M46 65V71"/></g>
    <g transform="translate(462 310) rotate(12)"><rect x="0" width="6" height="102" rx="2" fill="#71717a"/><path d="M-14 9H22V21H7V65H22V77H-14V65H0V21H-14Z" fill="#d9d9df" stroke="#52525b" strokeWidth="1.4"/><rect x="15" y="65" width="5" height="34" rx="2" fill="#52525b"/><rect x="11" y="94" width="13" height="24" rx="4" fill="#7C3AED"/></g>
  </svg>;
}
