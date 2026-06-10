import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../utils';

const inputClass =
  'w-full rounded-xl border border-stone-200/80 bg-white px-3.5 py-2.5 text-sm font-medium text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200 transition-colors duration-150';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(inputClass, className)} {...props} />;
});
