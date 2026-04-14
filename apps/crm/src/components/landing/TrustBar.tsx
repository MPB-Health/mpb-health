import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Shield, TrendingUp, Clock, Award } from 'lucide-react';

interface Stat {
  icon: React.ElementType;
  value: number;
  suffix: string;
  label: string;
}

const stats: Stat[] = [
  { icon: TrendingUp, value: 10000, suffix: '+', label: 'Leads Processed' },
  { icon: Clock, value: 35, suffix: '%', label: 'Faster Close Rate' },
  { icon: Award, value: 99.9, suffix: '%', label: 'Uptime SLA' },
  { icon: Shield, value: 100, suffix: '%', label: 'HIPAA Compliant' },
];

function AnimatedCounter({ value, suffix, inView }: { value: number; suffix: string; inView: boolean }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value, inView]);

  const formatted = value >= 1000
    ? display >= 1000 ? `${(display / 1000).toFixed(display >= value ? 0 : 0)}K` : display.toString()
    : value % 1 !== 0
      ? display.toFixed(1)
      : display.toString();

  return (
    <span className="tabular-nums">
      {value >= 1000 && display >= value ? '10K' : formatted}{suffix}
    </span>
  );
}

export function TrustBar() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <section ref={ref} className="relative py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-50 mb-4">
                <stat.icon className="w-6 h-6 text-primary-600" />
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-neutral-900">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} inView={inView} />
              </div>
              <p className="mt-1 text-sm font-medium text-neutral-500">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
