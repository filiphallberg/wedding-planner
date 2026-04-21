import type { LabelHTMLAttributes } from 'react';
import { cn } from '../utils';

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className, ...props }: LabelProps) {
  return <label className={cn('block text-xs font-medium text-stone-600', className)} {...props} />;
}
