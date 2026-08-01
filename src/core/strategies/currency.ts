import { CurrencyOptions } from '../../types';

export function formatCurrency(value: string, options: CurrencyOptions): string {
  const {
    decimalSeparator = '.',
    thousandSeparator = ',',
    symbol = '',
    symbolPosition = 'prefix',
  } = options;

  if (value === '') return '';

  const parts = value.split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];

  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);

  let result = formattedInteger;

  if (decimalPart !== undefined) {
    result += `${decimalSeparator}${decimalPart}`;
  }

  if (symbol) {
    result = symbolPosition === 'prefix' ? `${symbol}${result}` : `${result}${symbol}`;
  }

  return result;
}

export function unformatCurrency(value: string, options: CurrencyOptions): string {
   const { decimalSeparator = '.' } = options;
   const regex = new RegExp(`[^0-9${decimalSeparator}]`, 'g');
   let clean = value.replace(regex, '');
   
   clean = clean.replace(decimalSeparator, '.');
   
   return clean;
}

export function processCurrency(
  value: string,
  currency: CurrencyOptions,
  selectionStart: number | null,
  cardType?: 'visa' | 'mastercard' | 'amex' | 'troy' | 'unknown'
) {
  const { decimalSeparator = '.', thousandSeparator = ',', precision = 2 } = currency;
  
  const isDotThousand = thousandSeparator === '.';
  
  let hasDecimalSeparator = value.includes(decimalSeparator);
  
  if (!isDotThousand && value.includes('.')) {
      hasDecimalSeparator = true;
  }
  
  const rawDigits = value.replace(/[^0-9]/g, '');
  
  if (!rawDigits && !hasDecimalSeparator) {
    return { value: '', displayValue: '', cursorPosition: 0, cardType };
  }

  let finalRawValue = '';
  let finalDisplayValue = '';

  if (hasDecimalSeparator) {
     let separator = decimalSeparator;
     if (!value.includes(decimalSeparator) && value.includes('.') && !isDotThousand) {
         separator = '.';
     }

     const parts = value.split(separator);
     const integerPart = parts[0].replace(/[^0-9]/g, '');
     let decimalPart = parts[1]?.replace(/[^0-9]/g, '') || '';
     
     if (decimalPart.length > precision) {
        decimalPart = decimalPart.slice(0, precision);
     }
     
     finalRawValue = `${integerPart}.${decimalPart}`;
     finalDisplayValue = formatCurrency(finalRawValue, currency);
     
  } else {
     finalRawValue = rawDigits;
     finalDisplayValue = formatCurrency(rawDigits, { ...currency });
  }
  
  let cursorPosition = finalDisplayValue.length;

  if (selectionStart !== null) {
      const beforeCursor = value.slice(0, selectionStart);
      const digitsBeforeCursor = beforeCursor.replace(/[^0-9]/g, '').length;
      
      let digitsSeen = 0;
      for (let i = 0; i < finalDisplayValue.length; i++) {
          if (/[0-9]/.test(finalDisplayValue[i])) {
              digitsSeen++;
          }
          
          if (digitsSeen === digitsBeforeCursor) {
              cursorPosition = i + 1;
              break;
          }
      }

      const lastChar = value[selectionStart - 1];
      if (lastChar === decimalSeparator || lastChar === '.') {
          const separatorIndex = finalDisplayValue.indexOf(decimalSeparator);
          if (separatorIndex !== -1) {
              cursorPosition = separatorIndex + 1;
          }
      }
  }
  
  return { 
    value: finalRawValue, 
    displayValue: finalDisplayValue, 
    cursorPosition,
    cardType
  };
}
