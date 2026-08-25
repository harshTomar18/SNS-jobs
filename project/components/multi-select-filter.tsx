'use client';

import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, Search, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MultiSelectOption {
  label: string;
  value: string;
}

interface MultiSelectFilterProps {
  label: string;
  options: (string | MultiSelectOption)[];
  selectedValues: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelectFilter({
  label,
  options,
  selectedValues,
  onChange,
  placeholder,
  className,
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const normalizedOptions: MultiSelectOption[] = options.map((opt) =>
    typeof opt === 'string' ? { label: opt, value: opt } : opt
  );

  const filteredOptions = normalizedOptions.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const toggleOption = (val: string) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter((v) => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div className={cn('space-y-1', className)}>
      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
        {label}
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between bg-slate-50/70 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-700 h-9 hover:bg-white hover:border-indigo-500 transition-all text-left shadow-none',
              selectedValues.length > 0 && 'border-indigo-300 bg-indigo-50/40 text-indigo-900'
            )}
          >
            <span className="truncate pr-1">
              {selectedValues.length === 0
                ? placeholder || `All ${label}`
                : `${selectedValues.length} ${label} selected`}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              {selectedValues.length > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-indigo-600 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-full hover:bg-indigo-700"
                  onClick={clearAll}
                >
                  {selectedValues.length}
                </Badge>
              )}
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-2 bg-white border border-slate-100 rounded-xl shadow-xl z-50">
          <div className="space-y-2">
            {/* Search Input inside popover */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder={`Search ${label}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-8 pr-3 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Clear All / Quick actions bar */}
            {selectedValues.length > 0 && (
              <div className="flex items-center justify-between px-1 py-1 text-[11px] border-b border-slate-100 pb-1.5">
                <span className="text-slate-500 font-semibold">{selectedValues.length} selected</span>
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="text-indigo-600 hover:text-indigo-800 font-extrabold text-[10px]"
                >
                  Clear All
                </button>
              </div>
            )}

            {/* Options List */}
            <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
              {filteredOptions.length === 0 ? (
                <div className="text-xs text-slate-400 p-3 text-center font-medium">
                  No {label} found
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = selectedValues.includes(opt.value);
                  return (
                    <div
                      key={opt.value}
                      onClick={() => toggleOption(opt.value)}
                      className={cn(
                        'flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors select-none',
                        isSelected ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleOption(opt.value)}
                        className="rounded border-slate-300 data-[state=checked]:bg-indigo-600"
                      />
                      <span className="truncate flex-1">{opt.label}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-indigo-600 shrink-0" />}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
