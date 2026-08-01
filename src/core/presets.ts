import { MaskOptions, MaskPreset } from '../types';
import { MASKS } from './constants';

export const PRESETS: Record<MaskPreset, MaskOptions> = {
  card: {
    mask: MASKS.CARD,
    allowedChars: /[0-9]/,
    inputMode: 'numeric',
    type: 'tel',
    validate: true,
    validator: 'luhn',
    resolveMask: (value: string) => {
      const clean = value.replace(/\D/g, '');
      if (clean.startsWith('34') || clean.startsWith('37')) {
        return MASKS.AMEX;
      }
      return MASKS.CARD;
    },
  },
  expiry: {
    mask: MASKS.EXPIRY,
    allowedChars: /[0-9]/,
    inputMode: 'numeric',
    type: 'tel',
    validate: true,
    validator: 'expiry',
  },
  cvv: {
    mask: MASKS.CVV_3,
    allowedChars: /[0-9]/,
    inputMode: 'numeric',
    type: 'tel',
    resolveMask: (_value: string, allValues?: any, schema?: any) => {
       if (!allValues || !schema) return undefined;
       
       let cardFieldValue = '';
       let hasCardField = false;

       for (const key in schema) {
          const fieldConfig = schema[key];
          const isCard = fieldConfig === 'card' || (typeof fieldConfig === 'object' && fieldConfig.preset === 'card') || (typeof fieldConfig === 'object' && fieldConfig.mask === MASKS.CARD);
          
          if (isCard) {
             hasCardField = true;
             const val = allValues[key];
             if (val) {
                cardFieldValue = String(val).replace(/\D/g, '');
                break;
             }
          }
       }
       
       if (hasCardField) {
          if (cardFieldValue.startsWith('34') || cardFieldValue.startsWith('37')) {
             return MASKS.CVV_4;
          }
          return MASKS.CVV_3;
       }

       return undefined;
    }
  },
  tckn: {
    mask: MASKS.TCKN,
    allowedChars: /[0-9]/,
    inputMode: 'numeric',
    type: 'tel',
    validate: true,
    validator: 'tckn',
  },
  phone: {
    mask: MASKS.PHONE,
    allowedChars: /[0-9]/,
    inputMode: 'tel',
    type: 'tel',
  },
  email: {
    allowedChars: /[a-zA-Z0-9@._+-]/,
    inputMode: 'email',
    type: 'email',
    validate: true,
    validator: 'email',
  },
  url: {
    allowedChars: /[a-zA-Z0-9@:%._\+~#=/?&-]/,
    inputMode: 'url',
    type: 'url',
    validate: true,
    validator: 'url',
  },
  username: {
    usernameFormat: true,
    inputMode: 'text',
    type: 'text',
  },
  alpha: {
    allowedChars: /[a-zA-ZçÇğĞıİöÖşŞüÜ ]/,
    inputMode: 'text',
    type: 'text',
    alphaFormat: true,
  },
  password: {
    type: 'password',
  },
  text: {
    type: 'text',
  },
  currency: {
    currency: {
      precision: 2,
      // npm default: US/English grouping. Customize for TR etc. via options.
      decimalSeparator: '.',
      thousandSeparator: ',',
      symbol: '',
      symbolPosition: 'prefix',
    },
    allowedChars: /[0-9.,]/,
    inputMode: 'decimal',
    type: 'text',
  },
  iban: {
    mask: MASKS.IBAN,
    displayPrefix: 'TR',
    allowedChars: /[0-9]/,
    inputMode: 'numeric',
    type: 'tel',
    validate: true,
    validator: 'iban',
  },
  numeric: {
    allowedChars: /[0-9]/,
    inputMode: 'numeric',
    type: 'tel',
  },
  date: {
    mask: MASKS.DATE,
    allowedChars: /[0-9]/,
    inputMode: 'numeric',
    type: 'tel',
    validate: true,
    validator: 'date',
    dateFormat: 'DMY',
  },
  taxNumber: {
    mask: MASKS.TAX_NUMBER,
    allowedChars: /[0-9]/,
    inputMode: 'numeric',
    type: 'tel',
    validate: true,
    validator: 'vkn',
  },
  zipCode: {
    mask: MASKS.ZIP_CODE,
    allowedChars: /[0-9]/,
    inputMode: 'numeric',
    type: 'tel',
  },
};
