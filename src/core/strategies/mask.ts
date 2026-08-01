import { MaskOptions } from '../../types';
import { cleanValue } from '../../utils/string';

/** Derive which characters may enter the raw buffer from mask tokens. */
export function getDefaultAllowedChars(mask: string): RegExp | undefined {
  const hasDigitSlot = mask.includes('9');
  const hasLetterSlot = mask.includes('a') || mask.includes('A');
  const hasAnySlot = mask.includes('*');

  // `*` accepts any character — skip pre-filtering so applyMask can place slots.
  if (hasAnySlot) return undefined;
  if (hasDigitSlot && hasLetterSlot) return /[a-zA-Z0-9]/;
  if (hasDigitSlot) return /[0-9]/;
  if (hasLetterSlot) return /[a-zA-Z]/;
  return /[a-zA-Z0-9]/;
}

export function applyMask(value: string, mask: string): string {
  let valueIndex = 0;
  let result = '';
  
  for (let i = 0; i < mask.length; i++) {
    const maskChar = mask[i];
    
    if (valueIndex >= value.length) break;
    
    if (maskChar === '9') {
      if (/[0-9]/.test(value[valueIndex])) {
        result += value[valueIndex];
        valueIndex++;
      } else {
        valueIndex++; 
        i--; 
        continue;
      }
    } else if (maskChar === 'a' || maskChar === 'A') {
      if (/[a-zA-Z]/.test(value[valueIndex])) {
        result += value[valueIndex];
        valueIndex++;
      } else {
        valueIndex++;
        i--;
        continue;
      }
    } else if (maskChar === '*') {
      result += value[valueIndex];
      valueIndex++;
    } else {
      result += maskChar;
      if (value[valueIndex] === maskChar) {
        valueIndex++;
      }
    }
  }
  
  return result;
}

export function unmask(value: string, mask: string): string {
  return cleanValue(value, getDefaultAllowedChars(mask));
}

export function stripMask(value: string, mask: string): string {
  let result = '';
  let valueIndex = 0;
  
  for (let i = 0; i < mask.length; i++) {
    if (valueIndex >= value.length) break;
    
    const maskChar = mask[i];
    const valueChar = value[valueIndex];
    
    if (maskChar === '9' || maskChar === 'a' || maskChar === 'A' || maskChar === '*') {
      result += valueChar;
      valueIndex++;
    } else {
      if (valueChar === maskChar) {
        valueIndex++;
      }
    }
  }
  return result;
}

export function processMask(
  value: string,
  options: MaskOptions,
  selectionStart: number | null,
  previousValue: string,
  cardType?: 'visa' | 'mastercard' | 'amex' | 'troy' | 'unknown'
) {
  const { mask, allowedChars, forbiddenChars, transform, displayPrefix } = options;
  if (!mask) throw new Error("Mask is required for processMask");

  const effectiveAllowed = allowedChars ?? getDefaultAllowedChars(mask);
  
  let dataCharsBeforeCursor = 0;
  if (selectionStart !== null) {
      const beforeCursor = value.slice(0, selectionStart);
      const cleanBefore = cleanValue(beforeCursor, effectiveAllowed, forbiddenChars);
      dataCharsBeforeCursor = cleanBefore.length;
  }
  
  const raw = cleanValue(value, effectiveAllowed, forbiddenChars);
  
  let processedRaw = raw;
  if (transform === 'uppercase') processedRaw = processedRaw.toUpperCase();
  if (transform === 'lowercase') processedRaw = processedRaw.toLowerCase();

  if (selectionStart !== null && previousValue) {
      const isDeletion = value.length < previousValue.length;
      if (isDeletion) {
           const cleanPrev = cleanValue(previousValue, effectiveAllowed, forbiddenChars);
           if (cleanPrev === processedRaw) {
               if (dataCharsBeforeCursor > 0) {
                   processedRaw = processedRaw.slice(0, dataCharsBeforeCursor - 1) + processedRaw.slice(dataCharsBeforeCursor);
                   dataCharsBeforeCursor--; 
               }
           }
      }
  }

  const maskedPart = applyMask(processedRaw, mask);
  const displayValue = displayPrefix ? displayPrefix + maskedPart : maskedPart;
  // Never keep mask literals (spaces, parentheses, slashes) in form/raw state.
  // Prefer allowedChars scrub; fall back to slot extraction for `*`-style masks.
  const finalRawValue = effectiveAllowed
    ? cleanValue(maskedPart, effectiveAllowed, forbiddenChars)
    : stripMask(maskedPart, mask);
  
  let cursorPosition = 0;
  const prefixLen = displayPrefix?.length ?? 0;
  
  if (selectionStart !== null) {
      let matchesFound = 0;
      for (let i = 0; i < maskedPart.length; i++) {
           const maskChar = mask[i];
           const isDataSlot = maskChar === '9' || maskChar === 'a' || maskChar === 'A' || maskChar === '*';
           
           if (isDataSlot) {
               matchesFound++;
               if (matchesFound <= dataCharsBeforeCursor) {
                   cursorPosition = prefixLen + i + 1;
               }
           } else {
               if (matchesFound === dataCharsBeforeCursor) {
                   cursorPosition = prefixLen + i + 1;
               }
           }
           
           if (matchesFound > dataCharsBeforeCursor) break;
      }
  } else {
      cursorPosition = displayValue.length;
  }

  return { value: finalRawValue, displayValue, cursorPosition, cardType };
}
