import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '../utils';

const textareaClass =
  'w-full resize-y rounded-md border border-stone-200 px-2.5 py-1.5 text-sm text-stone-800 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, ...props },
  ref,
) {
  return <textarea ref={ref} className={cn(textareaClass, className)} {...props} />;
});
