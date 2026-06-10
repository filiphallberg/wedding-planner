import { tv } from 'tailwind-variants';
import type { TableShape } from '../state/tableShape';
import type { TablePaletteId } from './tablePalettes';

const paletteSlots = {
  stone: {
    base: 'bg-stone-50',
    table: 'bg-stone-100 border-stone-400',
    action: 'text-stone-900',
    details: 'text-stone-500',
    indicator: 'text-stone-700',
    fill: 'bg-stone-500',
    swatch: 'bg-stone-500',
  },
  rose: {
    base: 'bg-rose-50',
    table: 'bg-rose-100 border-rose-400',
    action: 'text-rose-900',
    details: 'text-rose-500',
    indicator: 'text-rose-700',
    fill: 'bg-rose-500',
    swatch: 'bg-rose-500',
  },
  orange: {
    base: 'bg-orange-50',
    table: 'bg-orange-100 border-orange-400',
    action: 'text-orange-900',
    details: 'text-orange-500',
    indicator: 'text-orange-700',
    fill: 'bg-orange-500',
    swatch: 'bg-orange-500',
  },
  amber: {
    base: 'bg-amber-50',
    table: 'bg-amber-100 border-amber-400',
    action: 'text-amber-900',
    details: 'text-amber-500',
    indicator: 'text-amber-700',
    fill: 'bg-amber-500',
    swatch: 'bg-amber-500',
  },
  lime: {
    base: 'bg-lime-50',
    table: 'bg-lime-100 border-lime-400',
    action: 'text-lime-900',
    details: 'text-lime-500',
    indicator: 'text-lime-700',
    fill: 'bg-lime-500',
    swatch: 'bg-lime-500',
  },
  emerald: {
    base: 'bg-emerald-50',
    table: 'bg-emerald-100 border-emerald-400',
    action: 'text-emerald-900',
    details: 'text-emerald-500',
    indicator: 'text-emerald-700',
    fill: 'bg-emerald-500',
    swatch: 'bg-emerald-500',
  },
  teal: {
    base: 'bg-teal-50',
    table: 'bg-teal-100 border-teal-400',
    action: 'text-teal-900',
    details: 'text-teal-500',
    indicator: 'text-teal-700',
    fill: 'bg-teal-500',
    swatch: 'bg-teal-500',
  },
  sky: {
    base: 'bg-sky-50',
    table: 'bg-sky-100 border-sky-400',
    action: 'text-sky-900',
    details: 'text-sky-500',
    indicator: 'text-sky-700',
    fill: 'bg-sky-500',
    swatch: 'bg-sky-500',
  },
  blue: {
    base: 'bg-blue-50',
    table: 'bg-blue-100 border-blue-400',
    action: 'text-blue-900',
    details: 'text-blue-500',
    indicator: 'text-blue-700',
    fill: 'bg-blue-500',
    swatch: 'bg-blue-500',
  },
  indigo: {
    base: 'bg-indigo-50',
    table: 'bg-indigo-100 border-indigo-400',
    action: 'text-indigo-900',
    details: 'text-indigo-500',
    indicator: 'text-indigo-700',
    fill: 'bg-indigo-500',
    swatch: 'bg-indigo-500',
  },
  violet: {
    base: 'bg-violet-50',
    table: 'bg-violet-100 border-violet-400',
    action: 'text-violet-900',
    details: 'text-violet-500',
    indicator: 'text-violet-700',
    fill: 'bg-violet-500',
    swatch: 'bg-violet-500',
  },
  fuchsia: {
    base: 'bg-fuchsia-50',
    table: 'bg-fuchsia-100 border-fuchsia-400',
    action: 'text-fuchsia-900',
    details: 'text-fuchsia-500',
    indicator: 'text-fuchsia-700',
    fill: 'bg-fuchsia-500',
    swatch: 'bg-fuchsia-500',
  },
} satisfies Record<
  TablePaletteId,
  {
    base: string;
    table: string;
    action: string;
    details: string;
    indicator: string;
    fill: string;
    swatch: string;
  }
>;

const tableVariants = tv({
  slots: {
    base: 'border-8 border-white rounded-3xl transition-shadow duration-300',
    body: 'relative mx-auto w-full p-6 sm:p-8',
    table: 'relative h-full w-full border-2',
    action:
      'mt-0.5 shrink-0 cursor-pointer rounded-full px-3.5 py-1.5 text-sm font-semibold bg-black/5 transition-colors duration-150 hover:bg-black/10',
    header: 'flex flex-wrap items-start justify-between gap-4 p-4',
    heading: 'font-display text-2xl font-bold leading-tight sm:text-3xl',
    details: 'text-sm font-semibold tabular-nums',
    indicator: 'ml-1 font-semibold',
    fill: 'h-full rounded-full transition-[width] duration-500',
    swatch: 'absolute inset-0 rounded-full',
  },
  variants: {
    shape: {
      oval: {
        base: 'rounded-3xl',
        table: 'aspect-5/4 rounded-full',
      },
      round: {
        base: 'rounded-3xl',
        table: 'aspect-square rounded-full',
      },
      square: {
        base: 'rounded-3xl',
        table: 'aspect-square rounded-xl',
      },
      rectangle: {
        base: 'rounded-3xl',
        table: 'aspect-square md:aspect-[2/1] xl:aspect-[3/1] rounded-2xl',
      },
    },
    paletteId: paletteSlots,
  },
});

export function tableVariantSlots(shape: TableShape, paletteId: TablePaletteId) {
  return tableVariants({ shape, paletteId });
}
