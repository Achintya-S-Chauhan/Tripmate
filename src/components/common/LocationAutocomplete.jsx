import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader2, X, Check, Globe } from 'lucide-react';
import { searchLocation } from '../../services/geocoding';

/**
 * Real City & Place Autocomplete Component
 * Powered by OpenStreetMap Nominatim.
 * Provides live debounced suggestions, duplicate place disambiguation,
 * keyboard navigation, and coordinate binding.
 */
export default function LocationAutocomplete({
  label,
  value = '',
  selectedLocation = null,
  onChange,
  onSelect,
  placeholder = 'Search city, town, or landmark...',
  required = false,
  error = null,
  helperText = null,
  disabled = false,
  icon: Icon = MapPin,
}) {
  const [inputValue, setInputValue] = useState(
    typeof value === 'string' ? value : value?.name || ''
  );
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [hasInteracted, setHasInteracted] = useState(false);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Sync external value changes
  useEffect(() => {
    if (typeof value === 'string') {
      setInputValue(value);
    } else if (value && value.name) {
      setInputValue(value.name);
    } else if (!value) {
      setInputValue('');
    }
  }, [value]);

  // Handle outside click to dismiss dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions when input changes
  const handleInputChange = (e) => {
    const text = e.target.value;
    setInputValue(text);
    setHasInteracted(true);
    if (onChange) onChange(text);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!text || text.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchLocation(text.trim(), 6);
        setSuggestions(results);
        setIsOpen(results.length > 0);
        setActiveIndex(-1);
      } catch (err) {
        console.warn('Autocomplete fetch error:', err);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 320);
  };

  // Select a suggestion
  const handleSelect = (item) => {
    setInputValue(item.name);
    setIsOpen(false);
    setActiveIndex(-1);
    setSuggestions([]);
    if (onSelect) onSelect(item);
    if (onChange) onChange(item.name);
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'ArrowDown' && inputValue.trim().length >= 2) {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          handleSelect(suggestions[activeIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
        break;
      default:
        break;
    }
  };

  // Clear input
  const handleClear = (e) => {
    e.stopPropagation();
    setInputValue('');
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
    if (onChange) onChange('');
    if (onSelect) onSelect(null);
    inputRef.current?.focus();
  };

  const isConfirmed = Boolean(selectedLocation && selectedLocation.lat && selectedLocation.lng);

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold text-travel-primary">
            {label}
            {required && <span className="text-travel-accent ml-0.5">*</span>}
          </label>
          {isConfirmed && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-travel-accent bg-travel-accent-soft px-1.5 py-0.5 rounded border border-travel">
              <Check className="w-3 h-3 stroke-[2.5]" />
              GPS Plotted
            </span>
          )}
        </div>
      )}

      {/* Input Field Container */}
      <div className="relative flex items-center">
        <div className="absolute left-3 text-travel-secondary pointer-events-none flex items-center justify-center">
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-travel-accent animate-spin" />
          ) : (
            <Icon className={`w-4 h-4 ${isConfirmed ? 'text-travel-accent' : 'text-travel-secondary'}`} />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          spellCheck="false"
          className={`w-full bg-travel-subtle text-travel-primary text-xs rounded-xl pl-9 pr-9 py-2.5 border transition-all duration-150 placeholder:text-travel-muted focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] ${
            error
              ? 'border-rose-500/80 focus:border-rose-500'
              : isConfirmed
              ? 'border-travel-accent focus:border-travel-accent'
              : 'border-travel hover:border-travel-strong focus:border-travel-accent'
          }`}
        />

        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 p-1 rounded-md text-travel-secondary hover:text-travel-primary hover:bg-travel-card transition"
            title="Clear input"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Validation or Helper Notice */}
      {error && <p className="text-rose-500 text-[11px] mt-1 font-medium">{error}</p>}
      {!error && helperText && <p className="text-travel-secondary text-[11px] mt-1">{helperText}</p>}

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-travel-card border border-travel rounded-xl shadow-elevated overflow-hidden backdrop-blur-md max-h-64 overflow-y-auto custom-scrollbar animate-fade-in text-travel-primary">
          <div className="px-3 py-1.5 bg-travel-subtle border-b border-travel flex items-center justify-between text-[10px] text-travel-secondary font-medium">
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3 text-travel-accent" />
              OpenStreetMap Suggestions
            </span>
            <span className="text-travel-muted font-mono">Use ↑↓ & Enter</span>
          </div>

          <ul className="py-1">
            {suggestions.map((item, index) => {
              const isSelected = index === activeIndex;
              return (
                <li
                  key={item.id || `${item.lat}-${item.lng}-${index}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`px-3 py-2 cursor-pointer transition-colors flex items-start gap-2.5 border-b border-travel last:border-0 ${
                    isSelected ? 'bg-travel-accent-soft text-travel-accent font-medium' : 'hover:bg-travel-subtle text-travel-primary'
                  }`}
                >
                  <div className="mt-0.5 p-1 rounded-md bg-travel-subtle text-travel-accent shrink-0">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-travel-primary truncate">{item.name}</p>
                      {item.countryCode && (
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-travel-subtle text-travel-secondary shrink-0 border border-travel">
                          {item.countryCode}
                        </span>
                      )}
                    </div>
                    {item.subtitle && (
                      <p className="text-[11px] text-travel-secondary truncate mt-0.5">{item.subtitle}</p>
                    )}
                    <p className="text-[10px] text-travel-muted font-mono mt-0.5">
                      {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
