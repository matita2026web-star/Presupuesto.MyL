
export enum UnitType {
  M2 = 'm²',
  UNIDAD = 'unidad',
  PAQUETE = 'paquete',
  HORA = 'hora',
  DIA = 'día',
  METRO = 'metro',
  KG = 'kg'
}

export type BudgetStatus = 'pendiente' | 'aceptado' | 'rechazado';

export interface RequiredMaterial {
  name: string;
  quantity: string;
}

export interface BusinessSettings {
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  logoUrl?: string;
  currency: string;
  defaultTax: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  unit: UnitType;
  category: string;
}

export interface BudgetOrderItem {
  productId: string;
  name: string;
  price: number;
  unit: UnitType;
  quantity: number;
  subtotal: number;
}

export interface ClientData {
  name: string;
  phone: string;
  email?: string;
  observations: string;
}

export interface Budget {
  id: string;
  date: string;
  validUntil: string;
  client: ClientData;
  items: BudgetOrderItem[];
  requiredMaterials: RequiredMaterial[];
  taxRate: number;
  discount: number;
  subtotal: number;
  total: number;
  status: BudgetStatus;
}
