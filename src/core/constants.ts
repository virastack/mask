export const MASKS = {
  CARD: '9999 9999 9999 9999',
  AMEX: '9999 999999 99999',
  EXPIRY: '99/99',
  CVV_3: '999',
  CVV_4: '9999',
  TCKN: '99999999999',
  // npm default: common NANP-style grouping. Customize for TR etc. via mask override.
  PHONE: '(999) 999-9999',
  IBAN: '99 9999 9999 9999 9999 9999 99',
  DATE: '99/99/9999',
  TAX_NUMBER: '9999999999',
  ZIP_CODE: '99999',
} as const;
