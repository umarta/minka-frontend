"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

interface GlobalSearchInputProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  onFilterToggle: () => void;
  isSearching?: boolean;
  hasActiveFilters?: boolean;
  placeholder?: string;
  className?: string;
}

export function GlobalSearchInput({
  onSearch,
  onClear,
  onFilterToggle,
  isSearching = false,
  hasActiveFilters = false,
  placeholder = "Cari kontak atau pesan...",
  className,
}: GlobalSearchInputProps) {
  const [localQuery, setLocalQuery] = useState("");
  const debouncedQuery = useDebounce(localQuery, 300);

  // Trigger search when debounced query changes
  useEffect(() => {
    onSearch(debouncedQuery);
  }, [debouncedQuery, onSearch]);

  const handleClear = useCallback(() => {
    setLocalQuery("");
    onClear();
  }, [onClear]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalQuery(e.target.value);
  };

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
      <Input
        type="text"
        placeholder={placeholder}
        value={localQuery}
        onChange={handleInputChange}
        className="pl-10 pr-20 text-sm h-9"
        disabled={isSearching}
      />
      
      <div className="absolute flex items-center gap-1 transform -translate-y-1/2 right-2 top-1/2">
        {/* Filter Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onFilterToggle}
          className={cn(
            "h-6 w-6 p-0",
            hasActiveFilters && "text-blue-600"
          )}
          title="Filter"
        >
          <Filter className="w-3 h-3" />
        </Button>
        
        {/* Clear Button */}
        {localQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="w-6 h-6 p-0 text-gray-400 hover:text-gray-600"
            title="Clear search"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
      
      {/* Loading indicator */}
      {isSearching && (
        <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
          <div className="w-3 h-3 border-b-2 border-blue-500 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
} 