'use client';

import { useEffect, useState } from 'react';
import { Input } from './Input';
import { MaterialIcon } from '@/components/icons/MaterialIcon';

interface DebouncedInputProps {
  value: string | number;
  onChange: (value: string | number) => void;
  debounce?: number;
  placeholder?: string;
  className?: string;
  fullWidth?: boolean;
}

export function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 500,
  placeholder = 'بحث...',
  className = '',
  fullWidth = false,
}: DebouncedInputProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [value, debounce, onChange]);

  return (
    <Input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
      leftIcon={<MaterialIcon name="search" className="text-slate-400" size="md" />}
      className={className}
      fullWidth={fullWidth}
    />
  );
}

