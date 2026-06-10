import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../utils';

const variants = {
  secondary:
    'rounded-full border border-stone-200/80 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-50 hover:border-stone-300 transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50',
  default:
    'rounded-full border border-stone-200/80 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-50 hover:border-stone-300 transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50',
  primary:
    'rounded-full border border-stone-900 bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 active:scale-[0.98] transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50',
} as const;

export type ButtonVariant = keyof typeof variants;

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'default', type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn('cursor-pointer disabled:cursor-not-allowed', variants[variant], className)}
      {...props}
    />
  );
});
