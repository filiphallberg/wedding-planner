import type { ReactNode } from 'react';
import { Label } from './Label';

export type FieldProps = {
  id: string;
  label: string;
  children: ReactNode;
  className?: string;
};

export function Field({ id, label, children, className }: FieldProps) {
  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
