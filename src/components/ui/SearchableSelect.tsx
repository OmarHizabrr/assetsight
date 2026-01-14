"use client";

import { MaterialIcon } from "@/components/icons/MaterialIcon";
import { Input } from "@/components/ui/Input";
import { useDarkMode } from "@/hooks/useDarkMode";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SearchableSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  className?: string;
  portal?: boolean;
}

function SearchableSelectComponent({
  label,
  value,
  onChange,
  options,
  placeholder = "اختر...",
  disabled = false,
  required = false,
  error,
  helperText,
  fullWidth = true,
  className = "",
  portal = true,
}: SearchableSelectProps) {
  const { isDark } = useDarkMode();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const optionsListRef = useRef<HTMLDivElement>(null);
  const inputComponentRef = useRef<HTMLInputElement>(null);

  const hasError = !!error;
  const selectedOption = options.find((opt) => opt.value === value);

  // تصفية الخيارات حسب البحث
  const filteredOptions = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((option) => {
      const label = (option.label || '').toLowerCase();
      const value = (option.value || '').toLowerCase();
      return label.includes(needle) || value.includes(needle);
    });
  }, [options, searchTerm]);

  const updateDropdownPosition = useCallback(() => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Cap dropdown max height but keep it within available viewport space
    const dropdownMaxHeightCap = 360;
    const gap = 8;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUp = spaceBelow < dropdownMaxHeightCap && spaceAbove > spaceBelow;

    const availableHeight = openUp ? (spaceAbove - gap) : (spaceBelow - gap);
    const dropdownMaxHeight = Math.max(160, Math.min(dropdownMaxHeightCap, availableHeight));

    const top = openUp
      ? Math.max(gap, rect.top - dropdownMaxHeight - gap)
      : Math.min(viewportHeight - gap, rect.bottom + gap);

    const left = Math.min(Math.max(gap, rect.left), viewportWidth - rect.width - gap);

    setDropdownStyle({
      position: 'fixed',
      top,
      left,
      width: rect.width,
      zIndex: 10050,
      maxHeight: dropdownMaxHeight,
    });
  }, []);

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      const clickedInsideContainer = containerRef.current?.contains(target);
      const clickedInsideDropdown = dropdownRef.current?.contains(target);

      if (!clickedInsideContainer && !clickedInsideDropdown) {
        setIsOpen(false);
        setSearchTerm("");
        setHighlightedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  // التركيز على حقل البحث عند فتح القائمة
  useEffect(() => {
    if (!isOpen) return;
    if (!inputComponentRef.current) return;

    // Avoid stealing focus if user already focused something inside the dropdown
    const active = document.activeElement;
    const focusAlreadyInsideDropdown = Boolean(active && dropdownRef.current?.contains(active));
    if (focusAlreadyInsideDropdown) return;

    // Use rAF so focus happens after layout/portal mount, preventing the first keystroke from being lost
    requestAnimationFrame(() => {
      const activeNow = document.activeElement;
      const focusNowInsideDropdown = Boolean(activeNow && dropdownRef.current?.contains(activeNow));
      if (focusNowInsideDropdown) return;
      inputComponentRef.current?.focus();
    });
  }, [isOpen]);

  // Position dropdown on open and keep it aligned on scroll/resize
  useEffect(() => {
    if (!isOpen || !portal) return;

    updateDropdownPosition();

    const handleScrollOrResize = () => {
      updateDropdownPosition();
    };

    window.addEventListener('resize', handleScrollOrResize);
    // capture=true ensures we react to scrolls in nested containers (like modal body)
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, portal, updateDropdownPosition]);

  // التمرير للخيار المميز
  useEffect(() => {
    if (!isOpen || highlightedIndex < 0) return;
    const container = optionsListRef.current;
    if (!container) return;

    const highlightedElement = container.querySelector(
      `[data-option-index="${highlightedIndex}"]`
    ) as HTMLElement | null;

    if (highlightedElement) {
      highlightedElement.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm("");
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    // If user starts typing while the trigger is focused, open dropdown and seed search
    // so the first character isn't lost.
    if (!isOpen) {
      const isPrintable = e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
      if (isPrintable) {
        e.preventDefault();
        setIsOpen(true);
        setSearchTerm(e.key);
        setHighlightedIndex(-1);
        if (portal) {
          requestAnimationFrame(() => updateDropdownPosition());
        }
        requestAnimationFrame(() => {
          inputComponentRef.current?.focus();
        });
        return;
      }
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          if (portal) {
            requestAnimationFrame(() => updateDropdownPosition());
          }
        } else {
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        }
        break;
      case "Enter":
        e.preventDefault();
        if (
          isOpen &&
          highlightedIndex >= 0 &&
          filteredOptions[highlightedIndex]
        ) {
          handleSelect(filteredOptions[highlightedIndex].value);
        } else if (isOpen && filteredOptions.length === 1) {
          handleSelect(filteredOptions[0].value);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSearchTerm("");
        setHighlightedIndex(-1);
        break;
    }
  };

  const baseStyles =
    `block w-full rounded-xl border-2 px-3.5 py-2.5 pr-12 text-base font-medium material-transition focus:outline-none focus:ring-2 focus:ring-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md hover:shadow-lg transition-all duration-200 ${isDark ? 'bg-slate-700/60 text-slate-50' : 'bg-white text-slate-800'
    }`;

  const selectStyles = hasError
    ? `border-error-400 ${isDark ? 'text-slate-50 bg-slate-700/60' : 'text-error-900 bg-gradient-to-r from-error-50 to-error-50/70'} placeholder-error-400 focus:border-error-500 focus:ring-error-500/30 shadow-error-200/50 hover:border-error-500`
    : isOpen
      ? `border-primary-500 ${isDark ? 'text-slate-50 bg-slate-700/70' : 'text-slate-800 bg-white'} placeholder-slate-400 focus:border-primary-500 focus:shadow-xl focus:shadow-primary-500/20 scale-[1.01]`
      : `border-slate-300 ${isDark ? 'border-slate-600 text-slate-50 bg-slate-700/60' : 'text-slate-800'} placeholder-slate-400 focus:border-primary-500 focus:shadow-xl focus:shadow-primary-500/20 hover:border-primary-400 hover:shadow-lg hover:scale-[1.01]`;

  const combinedClassName = `
    ${baseStyles}
    ${selectStyles}
    ${className}
  `
    .trim()
    .replace(/\s+/g, " ");

  return (
    <div className={fullWidth ? "w-full" : ""} ref={containerRef}>
      {label && (
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2.5 flex items-center gap-1.5">
          <span>{label}</span>
          {required && <span className="text-error-500 text-base">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => {
            if (disabled) return;
            setIsOpen((prev) => {
              const next = !prev;
              if (next && portal) {
                requestAnimationFrame(() => updateDropdownPosition());
              }
              return next;
            });
          }}
          className={combinedClassName}
          disabled={disabled}
          onKeyDown={handleKeyDown}
        >
          <span
            className={`${value ? (isDark ? 'text-slate-50 font-medium' : 'text-slate-800 font-medium') : (isDark ? 'text-slate-300' : 'text-slate-400')
              } truncate block text-right`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </button>

        {/* أيقونة السهم */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
          <div className={`transition-all duration-300 ${isOpen ? "rotate-180" : ""}`}>
            <svg
              className={`w-5 h-5 transition-colors material-transition ${hasError ? "text-error-500" : isOpen ? "text-primary-600" : "text-slate-500"
                }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        {isOpen && !disabled && (
          (portal && typeof window !== 'undefined')
            ? createPortal(
              <div
                ref={dropdownRef}
                className={`border-2 rounded-2xl shadow-2xl shadow-primary-500/25 overflow-hidden animate-scale-in backdrop-blur-sm ${isDark
                  ? 'bg-slate-800/95 border-slate-700/60'
                  : 'bg-white border-primary-200/60'
                  }`}
                style={{
                  ...dropdownStyle,
                  boxShadow: '0 20px 25px -5px rgba(115, 103, 240, 0.15), 0 10px 10px -5px rgba(115, 103, 240, 0.1)'
                }}
                onWheel={(e) => {
                  e.stopPropagation();
                }}
              >
                {/* حقل البحث */}
                <div className={`p-3 border-b-2 sticky top-0 z-10 backdrop-blur-sm ${isDark
                  ? 'border-slate-700/60 bg-slate-800/60'
                  : 'border-slate-100 bg-gradient-to-br from-primary-50/50 via-white to-primary-50/30'
                  }`}>
                  <Input
                    ref={inputComponentRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setHighlightedIndex(-1);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="ابحث..."
                    leftIcon={<MaterialIcon name="search" className="text-primary-500" size="md" />}
                    className="w-full"
                    fullWidth={true}
                  />
                </div>

                {/* قائمة الخيارات */}
                <div
                  ref={optionsListRef}
                  className="flex-1 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-primary-200 scrollbar-track-slate-100 py-3 px-2"
                  style={{
                    maxHeight: typeof dropdownStyle.maxHeight === 'number' ? Math.max(120, dropdownStyle.maxHeight - 70) : undefined,
                  }}
                >
                  {filteredOptions.length === 0 ? (
                    <div className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className={`w-20 h-20 rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg animate-pulse ${isDark ? 'from-slate-700 via-slate-800 to-slate-700' : 'from-slate-100 via-slate-200 to-slate-100'
                          }`}>
                          <MaterialIcon
                            name="search_off"
                            className={isDark ? 'text-slate-300' : 'text-slate-400'}
                            size="2xl"
                          />
                        </div>
                        <div className="space-y-1">
                          <p className={`${isDark ? 'text-slate-200' : 'text-slate-700'} text-base font-bold`}>لا توجد نتائج</p>
                          <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-sm`}>جرب البحث بكلمات مختلفة</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    filteredOptions.map((option, index) => (
                      <button
                        key={option.value}
                        type="button"
                        data-option-index={index}
                        onClick={() => handleSelect(option.value)}
                        className={`w-full text-right px-4 py-2.5 text-base font-medium material-transition relative group mx-1 rounded-xl mb-1 bg-transparent focus:outline-none ${value === option.value
                          ? "!bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 !text-white font-bold shadow-xl shadow-primary-500/50 transform scale-[1.02] border-2 border-primary-400"
                          : highlightedIndex === index
                            ? isDark
                              ? "!bg-gradient-to-r from-primary-900/40 via-primary-800/30 to-primary-900/40 !text-slate-50 font-semibold shadow-lg border-2 border-primary-700/40 transform scale-[1.01]"
                              : "!bg-gradient-to-r from-primary-50 via-primary-100/80 to-primary-50 !text-slate-900 font-semibold shadow-lg border-2 border-primary-300/60 transform scale-[1.01]"
                            : isDark
                              ? "!text-slate-200 hover:!bg-gradient-to-r hover:from-slate-700/40 hover:via-primary-900/20 hover:to-slate-700/40 hover:!text-slate-50 hover:shadow-md border-2 border-transparent hover:border-slate-600/60 hover:scale-[1.01]"
                              : "!text-slate-900 hover:!bg-gradient-to-r hover:from-slate-50 hover:via-primary-50/30 hover:to-slate-50 hover:!text-slate-900 hover:shadow-md border-2 border-transparent hover:border-primary-200 hover:scale-[1.01]"
                          }`}
                        onMouseEnter={() => setHighlightedIndex(index)}
                      >
                        <div className="flex items-center justify-between relative z-10">
                          <span className={`flex-1 text-right text-base ${value === option.value ? "text-white font-bold" : "font-semibold"
                            }`}>
                            {option.label}
                          </span>
                          {value === option.value && (
                            <div className="mr-3 flex items-center">
                              <div className="w-7 h-7 rounded-full bg-white/40 backdrop-blur-md flex items-center justify-center shadow-lg animate-scale-in">
                                <svg
                                  className="w-4 h-4 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3.5}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </div>
                            </div>
                          )}
                          {value !== option.value && highlightedIndex === index && (
                            <div className="mr-3 flex items-center">
                              <div className="w-2.5 h-2.5 rounded-full bg-primary-500 animate-pulse shadow-md"></div>
                            </div>
                          )}
                        </div>
                        {/* تأثير hover */}
                        {value !== option.value && (
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-primary-500/8 to-transparent opacity-0 group-hover:opacity-100 material-transition pointer-events-none"></div>
                        )}
                        {/* خط تحت العنصر المحدد */}
                        {value === option.value && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/40 rounded-b-xl"></div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>,
              document.body
            )
            : (
              <div
                ref={dropdownRef}
                className={`absolute z-50 w-full mt-2 border-2 rounded-2xl shadow-2xl shadow-primary-500/25 overflow-hidden animate-scale-in backdrop-blur-sm ${isDark
                  ? 'bg-slate-800/95 border-slate-700/60'
                  : 'bg-white border-primary-200/60'
                  }`}
                style={{
                  top: "100%",
                  boxShadow: '0 20px 25px -5px rgba(115, 103, 240, 0.15), 0 10px 10px -5px rgba(115, 103, 240, 0.1)'
                }}
                onWheel={(e) => {
                  e.stopPropagation();
                }}
              >
                {/* حقل البحث */}
                <div className={`p-3 border-b-2 sticky top-0 z-10 backdrop-blur-sm ${isDark
                  ? 'border-slate-700/60 bg-slate-800/60'
                  : 'border-slate-100 bg-gradient-to-br from-primary-50/50 via-white to-primary-50/30'
                  }`}>
                  <Input
                    ref={inputComponentRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setHighlightedIndex(-1);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="ابحث..."
                    leftIcon={<MaterialIcon name="search" className="text-primary-500" size="md" />}
                    className="w-full"
                    fullWidth={true}
                  />
                </div>
                <div
                  ref={optionsListRef}
                  className="flex-1 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-primary-200 scrollbar-track-slate-100 py-3 px-2"
                  style={{
                    maxHeight: 320,
                  }}
                >
                  {filteredOptions.length === 0 ? (
                    <div className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className={`w-20 h-20 rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg animate-pulse ${isDark ? 'from-slate-700 via-slate-800 to-slate-700' : 'from-slate-100 via-slate-200 to-slate-100'
                          }`}>
                          <MaterialIcon
                            name="search_off"
                            className={isDark ? 'text-slate-300' : 'text-slate-400'}
                            size="2xl"
                          />
                        </div>
                        <div className="space-y-1">
                          <p className={`${isDark ? 'text-slate-200' : 'text-slate-700'} text-base font-bold`}>لا توجد نتائج</p>
                          <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-sm`}>جرب البحث بكلمات مختلفة</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    filteredOptions.map((option, index) => (
                      <button
                        key={option.value}
                        type="button"
                        data-option-index={index}
                        onClick={() => handleSelect(option.value)}
                        className={`w-full text-right px-4 py-2.5 text-base font-medium material-transition relative group mx-1 rounded-xl mb-1 bg-transparent focus:outline-none ${value === option.value
                          ? "!bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 !text-white font-bold shadow-xl shadow-primary-500/50 transform scale-[1.02] border-2 border-primary-400"
                          : highlightedIndex === index
                            ? isDark
                              ? "!bg-gradient-to-r from-primary-900/40 via-primary-800/30 to-primary-900/40 !text-slate-50 font-semibold shadow-lg border-2 border-primary-700/40 transform scale-[1.01]"
                              : "!bg-gradient-to-r from-primary-50 via-primary-100/80 to-primary-50 !text-slate-900 font-semibold shadow-lg border-2 border-primary-300/60 transform scale-[1.01]"
                            : isDark
                              ? "!text-slate-200 hover:!bg-gradient-to-r hover:from-slate-700/40 hover:via-primary-900/20 hover:to-slate-700/40 hover:!text-slate-50 hover:shadow-md border-2 border-transparent hover:border-slate-600/60 hover:scale-[1.01]"
                              : "!text-slate-900 hover:!bg-gradient-to-r hover:from-slate-50 hover:via-primary-50/30 hover:to-slate-50 hover:!text-slate-900 hover:shadow-md border-2 border-transparent hover:border-primary-200 hover:scale-[1.01]"
                          }`}
                        onMouseEnter={() => setHighlightedIndex(index)}
                      >
                        <div className="flex items-center justify-between relative z-10">
                          <span className={`flex-1 text-right text-base ${value === option.value ? "text-white font-bold" : "font-semibold"
                            }`}>
                            {option.label}
                          </span>
                          {value === option.value && (
                            <div className="mr-3 flex items-center">
                              <div className="w-7 h-7 rounded-full bg-white/40 backdrop-blur-md flex items-center justify-center shadow-lg animate-scale-in">
                                <svg
                                  className="w-4 h-4 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3.5}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                        {value !== option.value && (
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-primary-500/8 to-transparent opacity-0 group-hover:opacity-100 material-transition pointer-events-none"></div>
                        )}
                        {value === option.value && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/40 rounded-b-xl"></div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )
        )}
      </div>
      {error && (
        <div className="mt-2 flex items-center gap-2 animate-fade-in">
          <MaterialIcon name="warning" className="text-error-500" size="sm" />
          <p className="text-xs text-error-600 dark:text-error-300 font-medium">{error}</p>
        </div>
      )}
      {helperText && !error && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">{helperText}</p>
      )}
    </div>
  );
}

export const SearchableSelect = memo(SearchableSelectComponent);
