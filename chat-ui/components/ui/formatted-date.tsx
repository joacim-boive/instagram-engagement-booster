'use client';

type DateStyle = 'full' | 'long' | 'medium' | 'short';
type TimeStyle = 'full' | 'long' | 'medium' | 'short';

interface FormattedDateProps {
  date: string | Date;
  className?: string;
  dateStyle?: DateStyle;
  timeStyle?: TimeStyle;
  showTime?: boolean;
}

export function FormattedDate({
  date,
  className,
  dateStyle = 'medium',
  timeStyle = 'short',
  showTime = false,
}: FormattedDateProps) {
  const dateObj = date instanceof Date ? date : new Date(date);

  return (
    <time dateTime={dateObj.toISOString()} className={className}>
      {dateObj.toLocaleString(undefined, {
        dateStyle,
        ...(showTime && { timeStyle }),
      })}
    </time>
  );
}
