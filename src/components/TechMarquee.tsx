import type { IconType } from 'react-icons';
import {
  SiNextdotjs,
  SiReact,
  SiTypescript,
  SiTailwindcss,
  SiPrisma,
  SiPostgresql,
  SiZod,
  SiVitest,
  SiVercel,
} from 'react-icons/si';

/**
 * Decorative tech-stack marquee for the bottom of the login page.
 *
 * Seamless loop: the list is rendered as 4 identical copies in one flex track;
 * `.animate-marquee` (globals.css) translates the track by -50% (= 2 copies). The
 * revealed half is therefore always ≥ 2 copies wide — wider than any viewport — so
 * there's no empty gap before the sequence repeats (the bug you'd get with only 2
 * copies on a wide screen, where one copy is narrower than the viewport). Spacing is
 * baked into each item's padding (not a flex gap) so the wrap stays uniform.
 * `prefers-reduced-motion` stops the animation (see globals.css).
 *
 * `color: undefined` = a mono/near-black brand mark (Next.js, Vercel, Prisma) that
 * would vanish on the slate-dark bg, so it adapts to a theme-neutral ink instead.
 */
type Tech = { name: string; Icon: IconType; color?: string };

const TECH: Tech[] = [
  { name: 'Next.js', Icon: SiNextdotjs },
  { name: 'React', Icon: SiReact, color: '#61DAFB' },
  { name: 'TypeScript', Icon: SiTypescript, color: '#3178C6' },
  { name: 'Tailwind CSS', Icon: SiTailwindcss, color: '#06B6D4' },
  { name: 'Prisma', Icon: SiPrisma },
  { name: 'PostgreSQL', Icon: SiPostgresql, color: '#4169E1' },
  { name: 'Zod', Icon: SiZod, color: '#3E67B1' },
  { name: 'Vitest', Icon: SiVitest, color: '#6E9F18' },
  { name: 'Vercel', Icon: SiVercel },
];

export function TechMarquee() {
  return (
    <div
      aria-hidden
      className="relative w-full overflow-hidden py-5 [mask-image:linear-gradient(to_right,transparent,#000_12%,#000_88%,transparent)]"
    >
      <div className="flex w-max animate-marquee">
        {[0, 1, 2, 3].map((copy) => (
          <ul key={copy} className="flex shrink-0">
            {TECH.map((t) => (
              <li key={t.name} className="flex shrink-0 items-center gap-2.5 px-10">
                <t.Icon
                  className={`h-8 w-8 ${t.color ? '' : 'text-gray-700 dark:text-gray-200'}`}
                  style={t.color ? { color: t.color } : undefined}
                />
                <span className="text-base font-medium whitespace-nowrap text-gray-500 dark:text-gray-400">
                  {t.name}
                </span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
