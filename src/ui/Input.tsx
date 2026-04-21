import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../utils';

const inputClass =
  'w-full rounded-md border border-stone-200 px-2.5 py-1.5 text-sm text-stone-800 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(inputClass, className)} {...props} />;
});
