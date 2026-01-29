import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/Input';
import { CheckCircle2 } from 'lucide-react';

interface ChipOption {
  value: string;
  label: string;
  icon?: string;
  description?: string;
}

interface ChipButtonsProps {
  options: ChipOption[];
  selected?: string;
  onSelect: (value: string) => void;
}

export function ChipButtons({ options, selected, onSelect }: ChipButtonsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onSelect(option.value)}
          className={`
            relative p-4 rounded-xl border-2 transition-all duration-200 text-left
            ${selected === option.value
              ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }
          `}
        >
          {option.icon && (
            <div className="text-3xl mb-2">{option.icon}</div>
          )}
          <div className="font-semibold text-gray-900">{option.label}</div>
          {option.description && (
            <div className="text-sm text-gray-600 mt-1">{option.description}</div>
          )}
          {selected === option.value && (
            <div className="absolute top-3 right-3">
              <CheckCircle2 className="h-5 w-5 text-blue-500" />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

interface MultiSelectChipsProps {
  options: ChipOption[];
  selected: string[];
  onToggle: (value: string) => void;
}

export function MultiSelectChips({ options, selected, onToggle }: MultiSelectChipsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((option) => {
        const isSelected = selected.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onToggle(option.value)}
            className={`
              relative px-4 py-2 rounded-lg border-2 transition-all duration-200
              ${isSelected
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400 text-gray-700'
              }
            `}
          >
            <span className="font-medium">{option.label}</span>
            {isSelected && (
              <CheckCircle2 className="inline-block ml-2 h-4 w-4" />
            )}
          </button>
        );
      })}
    </div>
  );
}

interface AgeInputsProps {
  ages: number[];
  onAgesChange: (ages: number[]) => void;
  householdType: string;
}

export function AgeInputs({ ages, onAgesChange, householdType }: AgeInputsProps) {
  const handleAgeChange = (index: number, value: string) => {
    const newAges = [...ages];
    const numValue = parseInt(value) || 0;
    newAges[index] = numValue;
    onAgesChange(newAges);
  };

  const addDependent = () => {
    onAgesChange([...ages, 0]);
  };

  const removeDependent = (index: number) => {
    const newAges = ages.filter((_, i) => i !== index);
    onAgesChange(newAges);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Your Age"
          type="number"
          min={18}
          max={64}
          value={ages[0] || ''}
          onChange={(e) => handleAgeChange(0, e.target.value)}
          placeholder="35"
        />
        {(householdType === 'family' || householdType === 'couple') && (
          <Input
            label="Spouse Age"
            type="number"
            min={18}
            max={64}
            value={ages[1] || ''}
            onChange={(e) => handleAgeChange(1, e.target.value)}
            placeholder="32"
          />
        )}
      </div>

      {householdType === 'family' && ages.length > 2 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Dependents</p>
          {ages.slice(2).map((age, index) => (
            <div key={index + 2} className="flex gap-2">
              <Input
                type="number"
                min={0}
                max={25}
                value={age || ''}
                onChange={(e) => handleAgeChange(index + 2, e.target.value)}
                placeholder="Child age"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => removeDependent(index + 2)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}

      {householdType === 'family' && ages.length < 8 && (
        <Button
          type="button"
          variant="outline"
          onClick={addDependent}
          className="w-full"
        >
          + Add Dependent
        </Button>
      )}
    </div>
  );
}
