import type { CustomerReadModel } from '@packages/shared-types';

/**
 * Formats customer name with fallback for anonymous customers
 * @param customer - Customer read model
 * @returns Formatted name or default text
 */
export function formatCustomerName(customer: CustomerReadModel): string {
  if (customer.name && customer.name.trim()) {
    return customer.name;
  }
  return 'Cliente sin nombre';
}

/**
 * Formats WhatsApp phone number for display
 * Adds + prefix if not present and formats with spaces
 * @param phone - WhatsApp phone number
 * @returns Formatted phone number
 */
export function formatCustomerPhone(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Add + prefix if not present
  const withPrefix = digits.startsWith('+') ? digits : `+${digits}`;
  
  // Format: +1 809 555 1234
  if (digits.length >= 10) {
    const countryCode = digits.slice(0, -10);
    const areaCode = digits.slice(-10, -7);
    const firstPart = digits.slice(-7, -4);
    const secondPart = digits.slice(-4);
    
    if (countryCode) {
      return `+${countryCode} ${areaCode} ${firstPart} ${secondPart}`;
    }
    return `${areaCode} ${firstPart} ${secondPart}`;
  }
  
  return withPrefix;
}

/**
 * Gets customer initials for avatar
 * @param customer - Customer read model
 * @returns Initials (max 2 characters)
 */
export function getCustomerInitials(customer: CustomerReadModel): string {
  const name = customer.name?.trim();
  
  if (!name) {
    return 'CS'; // Cliente Sin nombre
  }
  
  const parts = name.split(' ').filter(Boolean);
  
  if (parts.length === 0) {
    return 'CS';
  }
  
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  
  // First letter of first name + first letter of last name
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
