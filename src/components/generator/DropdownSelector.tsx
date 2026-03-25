"use client";

import { useState, useRef, useEffect } from "react";

interface DropdownOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface DropdownSelectorProps {
  value: string | null;
  onChange: (value: string | null) => void;
  options: DropdownOption[];
  placeholder: string;
  icon?: React.ReactNode;
}

export function DropdownSelector({ value, onChange, options, placeholder, icon }: DropdownSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const closeDropdown = () => {
    setIsOpen(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const startCloseTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      closeDropdown();
    }, 30000); // 30 seconds
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.id === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-full flex items-center gap-1 min-w-[80px] transition-all"
        style={{
          background: isOpen
            ? 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(16,185,129,0.2))'
            : 'var(--gen-button-bg)',
          border: isOpen
            ? '1px solid #f59e0b'
            : '1px solid var(--gen-border)',
          color: selectedOption ? 'var(--gen-text)' : 'var(--gen-text-muted)'
        }}
      >
        {icon && <span className="mr-1">{icon}</span>}
        <span>{selectedOption?.label || placeholder}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-4 w-4 opacity-60 transition-transform ${isOpen ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6"/></svg>
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 mt-1 z-50 rounded-lg shadow-xl py-1 min-w-[140px] max-h-[280px] overflow-y-auto"
          style={{
            background: 'var(--gen-bg)',
            border: '1px solid var(--gen-border)',
            backdropFilter: 'blur(10px)'
          }}
          onMouseLeave={startCloseTimer}
        >
          <button
            type="button"
            onClick={() => {
              onChange(null);
              closeDropdown();
            }}
            className="w-full px-3 py-2 text-left text-xs transition-colors hover:opacity-80"
            style={{ color: 'var(--gen-text-muted)' }}
            onMouseEnter={() => {
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
              }
            }}
          >
            {placeholder}
          </button>
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                onChange(option.id);
                closeDropdown();
              }}
              onMouseEnter={() => {
                if (timeoutRef.current) {
                  clearTimeout(timeoutRef.current);
                  timeoutRef.current = null;
                }
              }}
              className="w-full px-3 py-2 text-left text-xs transition-colors hover:opacity-80 flex items-center gap-2"
              style={{
                color: value === option.id ? '#f59e0b' : 'var(--gen-text)',
                background: value === option.id ? 'linear-gradient(90deg, rgba(245,158,11,0.2), transparent)' : 'transparent'
              }}
            >
              {option.icon && <span className="text-[10px]">{option.icon}</span>}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
