import type { ReactNode } from 'react';

export default function PageHeader({ eyebrow, title, text, children }: { eyebrow?: string; title: string; text?: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-mist to-white">
      <div className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-aqua/15 blur-3xl" />
      <div className="container-x relative py-14 sm:py-20">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1 className="mt-4 max-w-3xl text-4xl font-bold sm:text-5xl">{title}</h1>
        {text && <p className="mt-4 max-w-2xl text-base text-muted sm:text-lg">{text}</p>}
        {children}
      </div>
    </section>
  );
}
