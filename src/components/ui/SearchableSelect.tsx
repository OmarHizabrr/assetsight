"use client";

import { MaterialIcon } from "@/components/icons/MaterialIcon";
import { useEffect, useRef, useState } from "react";

interface SearchableSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  className?: string;
}

export function SearchableSelect({
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
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const hasError = !!error;
  const selectedOption = options.find((opt) => opt.value === value);

  // تصفية الخيارات حسب البحث
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
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
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // التمرير للخيار المميز
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && dropdownRef.current) {
      const highlightedElement = dropdownRef.current.children[
        highlightedIndex
      ] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
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

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
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
    "block w-full rounded-full border-2 bg-white px-4 py-3.5 pr-12 text-sm font-medium material-transition focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm hover:shadow-md transition-all duration-200";

  const selectStyles = hasError
    ? "border-error-300 text-error-900 placeholder-error-400 focus:border-error-500 focus:ring-error-500/20 bg-gradient-to-r from-error-50 to-error-50/70 shadow-error-200/50"
    : isOpen
    ? "border-primary-500 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:bg-white focus:shadow-xl focus:shadow-primary-500/20 bg-white"
    : "border-slate-200 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:bg-white focus:shadow-lg focus:shadow-primary-500/15 hover:border-primary-300 hover:shadow-md";

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
        <label className="block text-sm font-bold text-slate-800 mb-2.5">
          {label}
          {required && <span className="text-error-500 mr-1 font-bold">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={combinedClassName}
          disabled={disabled}
          onKeyDown={handleKeyDown}
        >
          <span className={`${value ? "text-slate-900 font-medium" : "text-slate-400"} truncate block`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </button>

        {/* أيقونة السهم */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
          <div className={`transition-all duration-300 ${isOpen ? "rotate-180" : ""}`}>
            <svg
              className={`w-5 h-5 transition-colors material-transition ${
                hasError ? "text-error-500" : isOpen ? "text-primary-600" : "text-slate-500"
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

        {/* القائمة المنسدلة */}
        {isOpen && !disabled && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-2 bg-white border-2 border-primary-200/60 rounded-xl shadow-2xl shadow-primary-500/20 max-h-64 overflow-hidden animate-scale-in backdrop-blur-sm"
            style={{ top: "100%" }}
          >
            {/* حقل البحث */}
            <div className="p-3 border-b-2 border-slate-100 bg-gradient-to-br from-primary-50/40 via-white to-primary-50/20 sticky top-0 z-10 backdrop-blur-sm">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setHighlightedIndex(-1);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="ابحث..."
                  className="w-full px-4 py-2.5 pr-10 border-2 border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 bg-white shadow-sm hover:shadow-md hover:border-primary-300 transition-all duration-200 placeholder:text-slate-400"
                />
                <MaterialIcon
                  name="search"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary-500 pointer-events-none"
                  size="sm"
                />
              </div>
            </div>

            {/* قائمة الخيارات */}
            <div className="overflow-y-auto max-h-56 scrollbar-thin scrollbar-thumb-primary-200 scrollbar-track-slate-100 py-2">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shadow-inner">
                      <MaterialIcon
                        name="search"
                        className="text-slate-400"
                        size="xl"
                      />
                    </div>
                    <p className="text-slate-600 text-sm font-semibold">لا توجد نتائج</p>
                    <p className="text-slate-400 text-xs">جرب البحث بكلمات مختلفة</p>
                  </div>
                </div>
              ) : (
                filteredOptions.map((option, index) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`w-full text-right px-5 py-3.5 text-sm font-medium material-transition relative group mx-2 rounded-xl ${
                      value === option.value
                        ? "bg-gradient-to-r from-primary-500 via-primary-600 to-primary-500 text-white font-semibold shadow-lg shadow-primary-500/40 transform scale-[1.02]"
                        : highlightedIndex === index
                        ? "bg-gradient-to-r from-primary-50 via-primary-100/70 to-primary-50 text-primary-700 font-semibold shadow-md border border-primary-200/50"
                        : "text-slate-700 hover:bg-gradient-to-r hover:from-slate-50 hover:via-primary-50/20 hover:to-slate-50 hover:text-slate-900 hover:shadow-sm border border-transparent hover:border-primary-100"
                    }`}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <div className="flex items-center justify-between relative z-10">
                      <span className={`flex-1 text-right ${
                        value === option.value ? "text-white" : ""
                      }`}>
                        {option.label}
                      </span>
                      {value === option.value && (
                        <div className="mr-2 flex items-center">
                          <div className="w-6 h-6 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center shadow-sm">
                            <svg
                              className="w-3.5 h-3.5 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        </div>
                      )}
                      {value !== option.value && highlightedIndex === index && (
                        <div className="mr-2 flex items-center">
                          <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></div>
                        </div>
                      )}
                    </div>
                    {/* تأثير hover */}
                    {value !== option.value && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 material-transition pointer-events-none"></div>
                    )}
                    {/* خط تحت العنصر المحدد */}
                    {value === option.value && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/30 rounded-b-xl"></div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      {error && (
        <div className="mt-2 flex items-center gap-2 animate-fade-in">
          <MaterialIcon name="warning" className="text-error-500" size="sm" />
          <p className="text-xs text-error-600 font-medium">{error}</p>
        </div>
      )}
      {helperText && !error && (
        <p className="mt-1 text-xs text-slate-500 font-medium">{helperText}</p>
      )}
    </div>
  );
}
