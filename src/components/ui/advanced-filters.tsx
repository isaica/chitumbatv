import React, { useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Separator } from '@/components/ui/separator';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface MultiSelectFilterProps {
  title: string;
  options: FilterOption[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  placeholder?: string;
  showCounts?: boolean;
  maxDisplayed?: number;
}

export function MultiSelectFilter({
  title,
  options,
  selectedValues,
  onSelectionChange,
  placeholder = "Selecionar...",
  showCounts = false,
  maxDisplayed = 3
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (value: string) => {
    if (selectedValues.includes(value)) {
      onSelectionChange(selectedValues.filter(v => v !== value));
    } else {
      onSelectionChange([...selectedValues, value]);
    }
  };

  const handleClear = () => {
    onSelectionChange([]);
  };

  const displayValues = selectedValues.slice(0, maxDisplayed);
  const remainingCount = selectedValues.length - maxDisplayed;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between min-w-[200px] h-auto min-h-[40px] px-3 py-2"
        >
          <div className="flex flex-wrap items-center gap-1">
            {selectedValues.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              <>
                {displayValues.map(value => {
                  const option = options.find(opt => opt.value === value);
                  return (
                    <Badge
                      key={value}
                      variant="secondary"
                      className="text-xs px-2 py-1"
                    >
                      {option?.label || value}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(value);
                        }}
                        className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  );
                })}
                {remainingCount > 0 && (
                  <Badge variant="outline" className="text-xs">
                    +{remainingCount} mais
                  </Badge>
                )}
              </>
            )}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder={`Buscar ${title.toLowerCase()}...`} />
          <CommandList>
            <CommandEmpty>Nenhuma opção encontrada.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                onSelect={handleClear}
                className="text-destructive cursor-pointer"
              >
                <X className="mr-2 h-4 w-4" />
                Limpar seleção
              </CommandItem>
              <Separator className="my-1" />
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => handleSelect(option.value)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      <Check
                        className={`mr-2 h-4 w-4 ${
                          selectedValues.includes(option.value)
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                      />
                      {option.label}
                    </div>
                    {showCounts && option.count !== undefined && (
                      <Badge variant="outline" className="text-xs">
                        {option.count}
                      </Badge>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface DateRangeFilterProps {
  startDate?: Date;
  endDate?: Date;
  onDateChange: (startDate?: Date, endDate?: Date) => void;
  placeholder?: string;
}

export function DateRangeFilter({
  startDate,
  endDate,
  onDateChange,
  placeholder = "Selecionar período"
}: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);

  const presetRanges = [
    {
      label: "Últimos 7 dias",
      range: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 7);
        return { start, end };
      }
    },
    {
      label: "Últimos 30 dias",
      range: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 30);
        return { start, end };
      }
    },
    {
      label: "Este mês",
      range: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { start, end };
      }
    },
    {
      label: "Mês passado",
      range: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        return { start, end };
      }
    }
  ];

  const formatDateRange = () => {
    if (!startDate || !endDate) return placeholder;
    return `${startDate.toLocaleDateString('pt-AO')} - ${endDate.toLocaleDateString('pt-AO')}`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="justify-between min-w-[200px]">
          {formatDateRange()}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="space-y-3">
          <div className="text-sm font-medium">Períodos predefinidos</div>
          <div className="grid gap-2">
            {presetRanges.map((preset, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className="justify-start"
                onClick={() => {
                  const { start, end } = preset.range();
                  onDateChange(start, end);
                  setOpen(false);
                }}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          
          <Separator />
          
          <Button
            variant="ghost"
            size="sm"
            className="justify-start text-destructive"
            onClick={() => {
              onDateChange(undefined, undefined);
              setOpen(false);
            }}
          >
            <X className="mr-2 h-4 w-4" />
            Limpar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface FilterBarProps {
  children: React.ReactNode;
  onClearAll?: () => void;
  activeFiltersCount?: number;
}

export function FilterBar({ children, onClearAll, activeFiltersCount = 0 }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/30 rounded-lg border">
      <div className="flex flex-wrap items-center gap-3 flex-1">
        {children}
      </div>
      
      {activeFiltersCount > 0 && onClearAll && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {activeFiltersCount} filtro{activeFiltersCount !== 1 ? 's' : ''} ativo{activeFiltersCount !== 1 ? 's' : ''}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-destructive hover:text-destructive"
          >
            <X className="w-4 h-4 mr-1" />
            Limpar todos
          </Button>
        </div>
      )}
    </div>
  );
}