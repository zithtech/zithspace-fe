"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Input, Spin } from "antd";
import { searchSkills, SkillOption } from "@/data/skillsData";
import { SearchOutlined } from "@ant-design/icons";

interface SkillsAutocompleteProps {
  value?: string;
  onChange?: (value: string, selectedSkill?: SkillOption) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function SkillsAutocomplete({
  value,
  onChange,
  placeholder = "Type to search skills...",
  disabled = false,
  className = "",
}: SkillsAutocompleteProps) {
  const [searchQuery, setSearchQuery] = useState(value || "");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<SkillOption | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredSkills = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchSkills(searchQuery).slice(0, 10); // Limit to 10 results
  }, [searchQuery]);

  useEffect(() => {
    if (value !== undefined && value !== searchQuery) {
      setSearchQuery(value);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.input?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
    setSelectedSkill(null);
    onChange?.(newValue);
  };

  const handleInputFocus = () => {
    if (searchQuery.trim()) {
      setIsOpen(true);
    }
  };

  const handleSkillSelect = (skill: SkillOption) => {
    setSearchQuery(skill.name);
    setSelectedSkill(skill);
    setIsOpen(false);
    setHighlightedIndex(-1);
    onChange?.(skill.name, skill);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filteredSkills.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredSkills.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredSkills.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSkillSelect(filteredSkills[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleClear = () => {
    setSearchQuery("");
    setSelectedSkill(null);
    setIsOpen(false);
    setHighlightedIndex(-1);
    onChange?.("");
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <Input
        ref={inputRef}
        value={searchQuery}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        suffix={<SearchOutlined className="text-gray-400" />}
        allowClear
        onClear={handleClear}
      />

      {isOpen && filteredSkills.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {filteredSkills.map((skill, index) => (
            <div
              key={`${skill.name}-${skill.category}`}
              className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                index === highlightedIndex
                  ? "bg-blue-50"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => handleSkillSelect(skill)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <img
                src={skill.logo}
                alt={skill.name}
                className="w-6 h-6 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  const placeholder = target.nextElementSibling as HTMLDivElement;
                  if (placeholder) placeholder.style.display = "flex";
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">
                  {skill.name}
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {skill.category}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isOpen && searchQuery.trim() && filteredSkills.length === 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-4 text-center text-gray-500">
          No skills found for "{searchQuery}"
        </div>
      )}
    </div>
  );
}
