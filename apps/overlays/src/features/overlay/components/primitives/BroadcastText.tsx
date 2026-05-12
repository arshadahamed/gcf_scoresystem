function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export function BroadcastText({
  children, size = 'md', weight = 'bold', className,
}: {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl';
  weight?: 'normal' | 'semibold' | 'bold';
  className?: string;
}) {
  const sizes = { sm: 'text-sm', md: 'text-base', lg: 'text-lg', xl: 'text-xl', '2xl': 'text-2xl', '4xl': 'text-4xl', '6xl': 'text-6xl' };
  const weights = { normal: 'font-normal', semibold: 'font-semibold', bold: 'font-bold' };
  return (
    <span className={cn('font-broadcast uppercase tracking-wide', sizes[size], weights[weight], className)}>
      {children}
    </span>
  );
}
