import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../utils';

const variants = {
  secondary:
    'rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50',
  default:
    'rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50',
  primary:
    'rounded-md border border-stone-300 bg-stone-900 px-3 py-2 text-sm text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50',
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
