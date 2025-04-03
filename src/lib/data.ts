
export interface Asset {
  id: string;
  name: string;
  tag: string;
  serial: string;
  model: string;
  category: string;
  status: "ready" | "assigned" | "pending" | "archived" | "broken";
  assignedTo?: string;
  purchaseDate: string;
  purchaseCost: string;
  location: string;
}

export interface Category {
  id: string;
  name: string;
  type: "asset" | "accessory" | "component" | "consumable" | "license";
  count: number;
}

// Empty arrays instead of sample data
export const assets: Asset[] = [];
export const categories: Category[] = [];
