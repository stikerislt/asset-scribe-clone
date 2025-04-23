import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Asset, AssetStatus } from "@/lib/api/assets";
import { StatusColor } from "@/lib/data";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { StatusColorIndicator } from "@/components/StatusColorIndicator";
import { CategoryIcon } from "@/components/CategoryIcon";
import { fetchCategories } from "@/lib/data";
import { toast } from "sonner";
import { useTenant } from "@/hooks/useTenant";

interface AssetFormProps {
  initialData?: Partial<Asset>;
  onSubmit: (data: Omit<Asset, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

interface CategoryWithIcon {
  name: string;
  icon?: string;
}

export const AssetForm = ({ initialData, onSubmit, onCancel, isSubmitting = false }: AssetFormProps) => {
  const [name, setName] = useState(initialData?.name || '');
  const [tag, setTag] = useState(initialData?.tag || '');
  const [status, setStatus] = useState<AssetStatus>(initialData?.status as AssetStatus || 'ready');
  const [statusColor, setStatusColor] = useState<StatusColor>(initialData?.status_color as StatusColor || 'green');
  const [category, setCategory] = useState(initialData?.category || '');
  const [serial, setSerial] = useState(initialData?.serial || '');
  const [model, setModel] = useState(initialData?.model || '');
  const [location, setLocation] = useState(initialData?.location || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [assignedTo, setAssignedTo] = useState(initialData?.assigned_to || '');
  const [purchaseDate, setPurchaseDate] = useState(initialData?.purchase_date || '');
  const [purchaseCost, setPurchaseCost] = useState(initialData?.purchase_cost?.toString() || '');
  const [wear, setWear] = useState(initialData?.wear || '');
  const [qty, setQty] = useState(initialData?.qty?.toString() || '1');
  const [categories, setCategories] = useState<CategoryWithIcon[]>([]);
  const { currentTenant } = useTenant();

  const defaultCategories = [
    { name: "Computer", icon: "computer" },
    { name: "Phone", icon: "phone" },
    { name: "Inventory", icon: "menu" },
    { name: "WWW", icon: "globe" },
    { name: "Tablet", icon: "tablet" },
    { name: "License", icon: "copyright" },
    { name: "Monitor", icon: "monitor" },
    { name: "Accessories", icon: "package" },
    { name: "Printer", icon: "printer" }
  ];

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const fetchedCategories = await fetchCategories();
        
        const categoriesWithIcons = fetchedCategories.map(cat => ({
          name: cat.name,
          icon: cat.icon || "archive"
        }));
        
        setCategories(categoriesWithIcons);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Failed to load categories");
      }
    };

    loadCategories();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTenant?.id) {
      toast.error("No tenant context found. Please check your organization settings.");
      return;
    }
    onSubmit({
      name,
      tag,
      status,
      status_color: statusColor,
      category,
      serial,
      model,
      location,
      notes,
      assigned_to: assignedTo,
      purchase_date: purchaseDate,
      purchase_cost: parseFloat(purchaseCost) || null,
      wear,
      qty: parseInt(qty) || 1,
      tenant_id: currentTenant.id
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Asset Name *</Label>
          <Input 
            id="name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="tag">Asset Tag *</Label>
          <Input 
            id="tag" 
            value={tag} 
            onChange={(e) => setTag(e.target.value)} 
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select 
            value={status} 
            onValueChange={(value: AssetStatus) => setStatus(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="deployed">Deployed</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="retired">Retired</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Status Color</Label>
          <RadioGroup 
            value={statusColor} 
            onValueChange={(value) => setStatusColor(value as StatusColor)}
            className="flex"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="green" id="green" />
              <Label htmlFor="green" className="flex items-center">
                <StatusColorIndicator color="green" className="mr-1" />
                <span>Good</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <RadioGroupItem value="yellow" id="yellow" />
              <Label htmlFor="yellow" className="flex items-center">
                <StatusColorIndicator color="yellow" className="mr-1" />
                <span>Warning</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <RadioGroupItem value="red" id="red" />
              <Label htmlFor="red" className="flex items-center">
                <StatusColorIndicator color="red" className="mr-1" />
                <span>Critical</span>
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select 
            value={category} 
            onValueChange={setCategory}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {defaultCategories.map((cat) => (
                <SelectItem key={cat.name} value={cat.name}>
                  <div className="flex items-center gap-2">
                    <CategoryIcon category={cat.name} iconType={cat.icon} />
                  </div>
                </SelectItem>
              ))}
              {categories.map((cat) => (
                <SelectItem key={cat.name} value={cat.name}>
                  <CategoryIcon category={cat.name} iconType={cat.icon} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="serial">Serial Number</Label>
          <Input 
            id="serial" 
            value={serial} 
            onChange={(e) => setSerial(e.target.value)} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Input 
            id="model" 
            value={model} 
            onChange={(e) => setModel(e.target.value)} 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input 
            id="location" 
            value={location} 
            onChange={(e) => setLocation(e.target.value)} 
            placeholder="Physical location of the asset"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="assignedTo">Assigned To</Label>
          <Input 
            id="assignedTo" 
            value={assignedTo} 
            onChange={(e) => setAssignedTo(e.target.value)} 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="purchaseDate">Purchase Date</Label>
          <Input 
            id="purchaseDate" 
            type="date"
            value={purchaseDate || ''}
            onChange={(e) => setPurchaseDate(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="purchaseCost">Purchase Cost</Label>
          <Input 
            id="purchaseCost"
            type="number"
            value={purchaseCost}
            onChange={(e) => setPurchaseCost(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="wear">Wear (Years Until Replacement)</Label>
          <Input 
            id="wear"
            value={wear}
            onChange={(e) => setWear(e.target.value)}
            placeholder="Expected years until asset needs replacement"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="qty">Quantity</Label>
          <Input 
            id="qty"
            type="number"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            min="1"
            placeholder="Quantity of this asset"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea 
          id="notes" 
          value={notes} 
          onChange={(e) => setNotes(e.target.value)} 
          placeholder="Additional information about this asset"
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Asset"}
        </Button>
      </div>
    </form>
  );
};
