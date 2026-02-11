
import { Product, Budget, BusinessSettings } from '../types';

const PRODUCTS_KEY = 'presuapp_v3_products';
const BUDGETS_KEY = 'presuapp_v3_budgets';
const SETTINGS_KEY = 'presuapp_v3_settings';

const DEFAULT_SETTINGS: BusinessSettings = {
  name: 'Mi Constructora',
  ownerName: 'Ing. Profesional',
  email: 'contacto@obra.com',
  phone: '',
  address: '',
  currency: '$',
  defaultTax: 0
};

export const storage = {
  getProducts: (): Product[] => {
    const data = localStorage.getItem(PRODUCTS_KEY);
    return data ? JSON.parse(data) : [];
  },
  saveProducts: (products: Product[]) => {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  },
  getBudgets: (): Budget[] => {
    const data = localStorage.getItem(BUDGETS_KEY);
    return data ? JSON.parse(data) : [];
  },
  saveBudgets: (budgets: Budget[]) => {
    localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets));
  },
  getSettings: (): BusinessSettings => {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : DEFAULT_SETTINGS;
  },
  saveSettings: (settings: BusinessSettings) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }
};
