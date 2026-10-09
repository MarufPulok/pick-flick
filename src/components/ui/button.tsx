import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

const buttonVariants = cva(
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-[background-color,border-color,opacity,transform] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        play: 'bg-accent text-accent-foreground hover:bg-accent/90',
        ghost: 'border border-border bg-transparent text-foreground hover:bg-foreground/6',
        quiet: 'bg-transparent text-muted-foreground hover:text-foreground',
        icon: 'size-10 rounded-full border border-border bg-transparent text-foreground hover:bg-foreground/6 data-[on=true]:border-accent data-[on=true]:bg-accent/15 data-[on=true]:text-accent',
      },
      size: {
        md: 'h-12 px-5 text-[15px]',
        sm: 'h-9 px-4 text-sm',
        none: '',
      },
    },
    defaultVariants: { variant: 'ghost', size: 'md' },
  }
);

export type ButtonProps = React.ComponentProps<'button'> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  const resolvedSize = variant === 'icon' ? 'none' : size;
  return <button className={cn(buttonVariants({ variant, size: resolvedSize }), className)} {...props} />;
}

export { buttonVariants };
