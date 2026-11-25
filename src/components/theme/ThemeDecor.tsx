/**
 * Theme-specific hero ornaments. Every layer is rendered, and globals.css
 * shows only the one matching the active `data-theme` (classic shows none),
 * so switching themes needs no re-render and no layout changes in <Hero>.
 */
export function HeroDecor() {
  return (
    <>
      {/* All themes: color wash over the photo (transparent for classic) */}
      <div aria-hidden className="hero-tint pointer-events-none absolute inset-0" />

      {/* Velvet Hour: inset gold frame + monogram */}
      <div aria-hidden className="decor decor-velvet pointer-events-none absolute inset-0">
        <div className="absolute inset-3 border border-wedding-gold/60 sm:inset-6" />
        <div className="absolute inset-[18px] border border-wedding-gold/25 sm:inset-[30px]" />
        <p className="absolute left-1/2 top-10 -translate-x-1/2 whitespace-nowrap text-[10px] uppercase tracking-[0.5em] text-wedding-gold sm:top-14 sm:text-xs">
          ✦ An evening, eventually ✦
        </p>
      </div>

      {/* Front Page: newspaper masthead */}
      <div aria-hidden className="decor decor-editorial pointer-events-none absolute inset-x-0 top-0">
        <div className="mx-auto max-w-5xl px-6 pt-6 text-wedding-onnight">
          <div className="flex items-center justify-between border-b border-wedding-onnight/60 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] sm:text-xs">
            <span>Vol. I — No. 1</span>
            <span className="hidden sm:inline">Late edition</span>
            <span>Price: one RSVP</span>
          </div>
          <div className="mt-[3px] border-b-[3px] border-wedding-onnight/80" />
          <p className="mt-3 inline-block bg-wedding-sage px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white sm:text-xs">
            Breaking: local couple to wed
          </p>
        </div>
      </div>

      {/* Spritz: rotating sticker badge */}
      <div aria-hidden className="decor decor-spritz pointer-events-none absolute right-5 top-6 sm:right-10 sm:top-10">
        <div className="grid h-28 w-28 rotate-12 place-items-center rounded-full bg-wedding-gold text-center text-wedding-night shadow-[0_6px_0_rgb(var(--c-night))] sm:h-36 sm:w-36">
          <div>
            <p className="font-display text-2xl leading-none sm:text-3xl">Yes,</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] sm:text-xs">
              really.
              <br />
              We’re doing it.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
