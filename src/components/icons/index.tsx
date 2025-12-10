'use client';

interface IconProps {
  className?: string;
  size?: number;
}

export function PlusIcon({ className = 'w-5 h-5', size }: IconProps) {
  const sizeStyle = size ? { width: size, height: size } : {};
  return (
    <svg
      className={className}
      style={sizeStyle}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

export function EditIcon({ className = 'w-5 h-5', size }: IconProps) {
  const sizeStyle = size ? { width: size, height: size } : {};
  return (
    <svg
      className={className}
      style={sizeStyle}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  );
}

export function DeleteIcon({ className = 'w-5 h-5', size }: IconProps) {
  const sizeStyle = size ? { width: size, height: size } : {};
  return (
    <svg
      className={className}
      style={sizeStyle}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

export function SearchIcon({ className = 'w-5 h-5', size }: IconProps) {
  const sizeStyle = size ? { width: size, height: size } : {};
  return (
    <svg
      className={className}
      style={sizeStyle}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

export function CloseIcon({ className = 'w-5 h-5', size }: IconProps) {
  const sizeStyle = size ? { width: size, height: size } : {};
  return (
    <svg
      className={className}
      style={sizeStyle}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export function CheckIcon({ className = 'w-5 h-5', size }: IconProps) {
  const sizeStyle = size ? { width: size, height: size } : {};
  return (
    <svg
      className={className}
      style={sizeStyle}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function ChevronRightIcon({ className = 'w-5 h-5', size }: IconProps) {
  const sizeStyle = size ? { width: size, height: size } : {};
  return (
    <svg
      className={className}
      style={sizeStyle}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function ChevronLeftIcon({ className = 'w-5 h-5', size }: IconProps) {
  const sizeStyle = size ? { width: size, height: size } : {};
  return (
    <svg
      className={className}
      style={sizeStyle}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

export function HomeIcon({ className = 'w-5 h-5', size }: IconProps) {
  const sizeStyle = size ? { width: size, height: size } : {};
  return (
    <svg
      className={className}
      style={sizeStyle}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );
}

export function UserIcon({ className = 'w-5 h-5', size }: IconProps) {
  const sizeStyle = size ? { width: size, height: size } : {};
  return (
    <svg
      className={className}
      style={sizeStyle}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}

export function LogoutIcon({ className = 'w-5 h-5', size }: IconProps) {
  const sizeStyle = size ? { width: size, height: size } : {};
  return (
    <svg
      className={className}
      style={sizeStyle}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  );
}

