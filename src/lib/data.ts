
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

// Sample assets data
export const assets: Asset[] = [
  {
    id: "1",
    name: "MacBook Pro 16",
    tag: "LAPTOP-001",
    serial: "C02ZW1ZGPGZZ",
    model: "MacBook Pro 16 (2023)",
    category: "Laptop",
    status: "assigned",
    assignedTo: "Sarah Johnson",
    purchaseDate: "2023-05-15",
    purchaseCost: "$2,399.00",
    location: "Main Office"
  },
  {
    id: "2",
    name: "Dell XPS 15",
    tag: "LAPTOP-002",
    serial: "4N5JL33",
    model: "XPS 15 9570",
    category: "Laptop",
    status: "ready",
    purchaseDate: "2022-11-03",
    purchaseCost: "$1,799.00",
    location: "IT Storage"
  },
  {
    id: "3",
    name: "iPhone 14 Pro",
    tag: "PHONE-021",
    serial: "DNQVKKLA0PJK",
    model: "iPhone 14 Pro",
    category: "Mobile Phone",
    status: "assigned",
    assignedTo: "Michael Chen",
    purchaseDate: "2023-01-20",
    purchaseCost: "$999.00",
    location: "Remote"
  },
  {
    id: "4",
    name: "Samsung S22 Ultra",
    tag: "PHONE-022",
    serial: "R58N70BT2XM",
    model: "Galaxy S22 Ultra",
    category: "Mobile Phone",
    status: "broken",
    purchaseDate: "2022-08-12",
    purchaseCost: "$1,199.00",
    location: "Main Office"
  },
  {
    id: "5",
    name: "Dell UltraSharp 27",
    tag: "MONITOR-014",
    serial: "CN0WG42365GV",
    model: "U2720Q",
    category: "Monitor",
    status: "ready",
    purchaseDate: "2022-10-01",
    purchaseCost: "$499.99",
    location: "IT Storage"
  },
  {
    id: "6",
    name: "Logitech MX Master 3",
    tag: "MOUSE-045",
    serial: "LM19273HY",
    model: "MX Master 3",
    category: "Peripherals",
    status: "assigned",
    assignedTo: "Jessica Adams",
    purchaseDate: "2023-02-15",
    purchaseCost: "$99.99",
    location: "Design Department"
  },
  {
    id: "7",
    name: "iPad Pro 12.9",
    tag: "TABLET-008",
    serial: "DMPVKKLM1PLF",
    model: "iPad Pro 12.9 (2022)",
    category: "Tablet",
    status: "pending",
    purchaseDate: "2023-05-30",
    purchaseCost: "$1,099.00",
    location: "Shipping"
  },
  {
    id: "8",
    name: "ThinkPad X1 Carbon",
    tag: "LAPTOP-015",
    serial: "MP-2022-X1C-001",
    model: "X1 Carbon Gen 10",
    category: "Laptop",
    status: "archived",
    purchaseDate: "2021-06-12",
    purchaseCost: "$1,649.00",
    location: "Storage"
  }
];

// Sample categories data
export const categories: Category[] = [
  {
    id: "1",
    name: "Laptop",
    type: "asset",
    count: 32
  },
  {
    id: "2",
    name: "Desktop",
    type: "asset",
    count: 18
  },
  {
    id: "3",
    name: "Mobile Phone",
    type: "asset",
    count: 47
  },
  {
    id: "4",
    name: "Tablet",
    type: "asset",
    count: 15
  },
  {
    id: "5",
    name: "Monitor",
    type: "asset",
    count: 23
  },
  {
    id: "6",
    name: "Peripherals",
    type: "accessory",
    count: 56
  },
  {
    id: "7",
    name: "Software",
    type: "license",
    count: 28
  },
  {
    id: "8",
    name: "Memory",
    type: "component",
    count: 34
  }
];
