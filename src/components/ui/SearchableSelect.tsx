"use client";

import { MaterialIcon } from "@/components/icons/MaterialIcon";
import { Input } from "@/components/ui/Input";
import { memo, useEffect, useRef, useState } from "react";

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
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputComponentRef = useRef<HTMLInputElement>(null);

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
    if (isOpen && inputComponentRef.current) {
      inputComponentRef.current.focus();
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
    "block w-full rounded-xl border-2 bg-white px-3.5 py-2.5 pr-12 text-base font-medium material-transition focus:outline-none focus:ring-2 focus:ring-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md hover:shadow-lg transition-all duration-200";

  const selectStyles = hasError
    ? "border-error-400 text-error-900 placeholder-error-400 focus:border-error-500 focus:ring-error-500/30 bg-gradient-to-r from-error-50 to-error-50/70 shadow-error-200/50 hover:border-error-500"
    : isOpen
    ? "border-primary-500 text-slate-800 placeholder-slate-400 focus:border-primary-500 focus:bg-white focus:shadow-xl focus:shadow-primary-500/20 bg-white scale-[1.01]"
    : "border-slate-300 text-slate-800 placeholder-slate-400 focus:border-primary-500 focus:bg-white focus:shadow-xl focus:shadow-primary-500/20 hover:border-primary-400 hover:shadow-lg hover:scale-[1.01]";

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
        <label className="block text-sm font-bold text-slate-700 mb-2.5 flex items-center gap-1.5">
          <span>{label}</span>
          {required && <span className="text-error-500 text-base">*</span>}
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
          <span className={`${value ? "text-slate-800 font-medium" : "text-slate-400"} truncate block text-right`}>
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
            className="absolute z-50 w-full mt-2 bg-white border-2 border-primary-200/60 rounded-2xl shadow-2xl shadow-primary-500/25 max-h-80 overflow-hidden animate-scale-in backdrop-blur-sm"
            style={{ 
              top: "100%",
              boxShadow: '0 20px 25px -5px rgba(115, 103, 240, 0.15), 0 10px 10px -5px rgba(115, 103, 240, 0.1)'
            }}
          >
            {/* حقل البحث */}
            <div className="p-3 border-b-2 border-slate-100 bg-gradient-to-br from-primary-50/50 via-white to-primary-50/30 sticky top-0 z-10 backdrop-blur-sm">
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
            <div className="overflow-y-auto max-h-72 scrollbar-thin scrollbar-thumb-primary-200 scrollbar-track-slate-100 py-3 px-2">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100 flex items-center justify-center shadow-lg animate-pulse">
                      <MaterialIcon
                        name="search_off"
                        className="text-slate-400"
                        size="2xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-700 text-base font-bold">لا توجد نتائج</p>
                      <p className="text-slate-500 text-sm">جرب البحث بكلمات مختلفة</p>
                    </div>
                  </div>
                </div>
              ) : (
                filteredOptions.map((option, index) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`w-full text-right px-4 py-2.5 text-base font-medium material-transition relative group mx-1 rounded-xl mb-1 ${
                      value === option.value
                        ? "bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 text-white font-bold shadow-xl shadow-primary-500/50 transform scale-[1.02] border-2 border-primary-400"
                        : highlightedIndex === index
                        ? "bg-gradient-to-r from-primary-50 via-primary-100/80 to-primary-50 text-primary-800 font-semibold shadow-lg border-2 border-primary-300/60 transform scale-[1.01]"
                        : "text-slate-700 hover:bg-gradient-to-r hover:from-slate-50 hover:via-primary-50/30 hover:to-slate-50 hover:text-slate-900 hover:shadow-md border-2 border-transparent hover:border-primary-200 hover:scale-[1.01]"
                    }`}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <div className="flex items-center justify-between relative z-10">
                      <span className={`flex-1 text-right text-base ${
                        value === option.value ? "text-white font-bold" : "font-semibold"
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

export const SearchableSelect = memo(SearchableSelectComponent);
