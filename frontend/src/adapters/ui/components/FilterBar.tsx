import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

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

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-card rounded-lg border border-border">
      {filters.map((filter, index) => (
        <div key={index} className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">{filter.label}</label>
          <Select value={filter.value || "all"} onValueChange={(v) => filter.onChange(v === "all" ? undefined : v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={`All ${filter.label}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {filter.label}</SelectItem>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
      
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="self-end"
        >
          <X className="h-4 w-4 mr-2" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}
