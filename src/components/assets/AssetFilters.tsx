
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUpDown, Search, X } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent 
} from "@/components/ui/popover";

export type FilterOption = string;

export interface Filters {
  tag: string[];
  name: string[];
  assignedTo: string[];
  purchaseDate: string[];
  wear: string[];
  purchaseCost: string[];
  category: string[]; // Added category filter
}

interface AssetFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  activeFilters: Filters;
  setActiveFilters: React.Dispatch<React.SetStateAction<Filters>>;
  filterOptions: {
    tag: FilterOption[];
    name: FilterOption[];
    assignedTo: FilterOption[];
    purchaseDate: FilterOption[];
    wear: FilterOption[];
    purchaseCost: FilterOption[];
    category: FilterOption[]; // Added category filter options
  };
  isFiltersOpen: boolean;
  setIsFiltersOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const AssetFilters = ({
  searchTerm,
  setSearchTerm,
  activeFilters,
  setActiveFilters,
  filterOptions,
  isFiltersOpen,
  setIsFiltersOpen
}: AssetFiltersProps) => {
  const isFilterActive = (key: keyof Filters) => {
    return activeFilters[key] && activeFilters[key].length > 0;
  };
  
  const activeFilterCount = Object.values(activeFilters).reduce(
    (count, filters) => count + filters.length, 0
  );
  
  const toggleFilter = (key: keyof Filters, value: string) => {
    setActiveFilters(prev => {
      const currentFilters = [...prev[key]];
      const valueIndex = currentFilters.indexOf(value);
      
      if (valueIndex === -1) {
        return { ...prev, [key]: [...currentFilters, value] };
      } else {
        currentFilters.splice(valueIndex, 1);
        return { ...prev, [key]: currentFilters };
      }
    });
  };
  
  const clearFilters = (key: keyof Filters) => {
    setActiveFilters(prev => ({ ...prev, [key]: [] }));
  };
  
  const clearAllFilters = () => {
    setActiveFilters({
      tag: [],
      name: [],
      assignedTo: [],
      purchaseDate: [],
      wear: [],
      purchaseCost: []
    });
  };
  
  const renderFilterPopover = (
    title: string, 
    options: string[], 
    filterKey: keyof Filters
  ) => {
    const selectedFilters = activeFilters[filterKey];
    const [searchFilter, setSearchFilter] = useState("");
    
    const filteredOptions = searchFilter 
      ? options.filter(option => 
          option.toLowerCase().includes(searchFilter.toLowerCase()))
      : options;
    
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-8 px-2 ${isFilterActive(filterKey) ? 'bg-accent text-accent-foreground' : ''}`}
          >
            <ArrowUpDown className="h-3 w-3 mr-2" />
            {title}
            {isFilterActive(filterKey) && (
              <Badge variant="secondary" className="ml-2 px-1 font-normal">
                {selectedFilters.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <div className="p-2">
            <div className="flex items-center justify-between pb-2">
              <h4 className="font-medium text-sm">{title} Filter</h4>
              <Button
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 text-xs"
                onClick={() => clearFilters(filterKey)}
                disabled={selectedFilters.length === 0}
              >
                Reset
              </Button>
            </div>
            
            {filterKey === 'assignedTo' && options.length > 5 && (
              <div className="relative mb-2">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="pl-8 h-9"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                />
              </div>
            )}
            
            <div className="max-h-[300px] overflow-auto space-y-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${filterKey}-${option}`}
                      checked={selectedFilters.includes(option)}
                      onCheckedChange={() => toggleFilter(filterKey, option)}
                    />
                    <label 
                      htmlFor={`${filterKey}-${option}`}
                      className="text-sm font-normal cursor-pointer flex-1 truncate"
                    >
                      {option || "(Empty)"}
                    </label>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground py-2 text-center">
                  {searchFilter ? "No matching results" : "No options available"}
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  };
  
  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={isFiltersOpen ? "secondary" : "outline"}
            size="sm"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="whitespace-nowrap"
          >
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
          {activeFilterCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="whitespace-nowrap"
            >
              Clear All
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      {isFiltersOpen && (
        <div className="mt-4 flex flex-wrap gap-2">
          {renderFilterPopover("Tag", filterOptions.tag, "tag")}
          {renderFilterPopover("Name", filterOptions.name, "name")}
          {renderFilterPopover("Category", filterOptions.category, "category")}
          {renderFilterPopover("Assigned To", filterOptions.assignedTo, "assignedTo")}
          {renderFilterPopover("Purchase Date", filterOptions.purchaseDate, "purchaseDate")}
          {renderFilterPopover("Wear", filterOptions.wear, "wear")}
          {renderFilterPopover("Purchase Cost", filterOptions.purchaseCost, "purchaseCost")}
        </div>
      )}
    </div>
  );
};
