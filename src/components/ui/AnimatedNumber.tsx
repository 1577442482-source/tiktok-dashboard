import { useCountUp } from '../../hooks/useCountUp';

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  enabled?: boolean;
  className?: string;
}

export default function AnimatedNumber({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  duration = 1200,
  enabled = true,
  className = '',
}: AnimatedNumberProps) {
  const animated = useCountUp({ target: value, duration, enabled, decimals });

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(animated);

  return (
    <span className={`tabular-nums ${className}`}>
      {prefix}{formatted}{suffix}
    </span>
  );
}
