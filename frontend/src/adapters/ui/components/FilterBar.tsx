import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterBarProps {
  filters: {
    label: string;
    value: string | undefined;
    options: FilterOption[];
    onChange: (value: string | undefined) => void;
  }[];
  onReset: () => void;
}

export function FilterBar({ filters, onReset }: FilterBarProps) {
  const hasActiveFilters = filters.some(f => f.value !== undefined);
  const activeFilterCount = filters.filter(f => f.value !== undefined).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Filters</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFilterCount} active
            </Badge>
          )}
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-8 text-xs gap-1.5"
          >
            <X className="h-3 w-3" />
            Clear All
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filters.map((filter, index) => (
          <div key={index} className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {filter.label}
            </label>
            <Select 
              value={filter.value || "all"} 
              onValueChange={(v) => filter.onChange(v === "all" ? undefined : v)}
            >
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder={`All ${filter.label}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="font-medium">All {filter.label}</span>
                </SelectItem>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filter.value && (
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="text-xs">
                  {filter.options.find(o => o.value === filter.value)?.label || filter.value}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => filter.onChange(undefined)}
                  className="h-5 w-5 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
