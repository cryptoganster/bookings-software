/**
 * Customer Search Feature - Public API
 *
 * Expone solo los elementos que deben ser accesibles desde otras capas
 * siguiendo Feature-Sliced Design
 */

// UI Components
export { SearchCustomersForm } from "./ui/SearchCustomersForm";
export { CustomerFilters } from "./ui/CustomerFilters";

// Hooks
export { useSearchCustomers } from "./model/useSearchCustomers";
