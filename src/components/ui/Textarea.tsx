'use client';

import { Input } from './Input';

// Textarea is now just an alias for Input - unified field component
// All fields use the same component with auto-resize and line-height: 1
const Textarea = Input;

Textarea.displayName = 'Textarea';

export type { InputProps as TextareaProps } from './Input';
export { Textarea };

