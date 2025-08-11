// hooks/useContactPicker.js
import { useState } from 'react';

export const useContactPicker = () => {
  const [isSupported] = useState('contacts' in navigator);
  
  const pickContacts = async () => {
    if (!isSupported) {
      throw new Error('Contact Picker API nie jest obsługiwane w tej przeglądarce');
    }
    
    try {
      const contacts = await navigator.contacts.select([
        'name', 
        'tel', 
        'email'
      ], { 
        multiple: true 
      });
      
      return contacts.map(contact => ({
        uid: crypto.randomUUID(), // Zgodne z twoim systemem uid
        displayName: contact.name?.[0] || 'Nieznana osoba',
        phone: contact.tel?.[0] || '',
        email: contact.email?.[0] || '',
        image: '/default-avatar.png', // Domyślny avatar
        source: 'contacts',
        addedAt: Date.now()
      }));
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Użytkownik anulował wybór kontaktów');
        return [];
      }
      throw error;
    }
  };
  
  return { isSupported, pickContacts };
};
