# Changelog

## [v1.0.0] - 2026-07-22

### Initial Release

- **@virastack/mask**: A lightweight, zero-dependency masking library for React Hook Form is now live!
- **Architecture**: Custom masking engine built for performance and reliability.
- **Hook**: `useViraMask` provides a simple, type-safe API for React Hook Form.
- **React Server Components**: Added `'use client'` directive for Next.js App Router and TanStack Start compatibility.

### Features

- **Full Type Support**: Enhanced TypeScript definitions for better developer experience.
- **Validation**: Built-in algorithmic validation for Credit Cards (Luhn) and Turkish Identity Number (TCKN).
- **Enhanced Card Validation**: Strict length checks based on card type (15 digits for Amex, 16 digits for others).
- **Card Type Detection**: Added `onCardTypeChange` callback to detect card issuer (Visa, Mastercard, Amex, Troy).
- **Dynamic CVV**: CVV field automatically adjusts length (3 or 4 digits) based on the entered card number.
- **Dynamic Masking**: Support for Amex cards (auto-switches to 4-6-5 format).
- **Presets**: Includes `card`, `expiry`, `cvv`, `tckn`, `phone`, `email`, `url`, `username`, `iban`, `taxNumber`, `zipCode`, `date`, `numeric`, and `currency`.
- **Currency Formatting**: Advanced currency handling with precision, decimal/thousand separators, and prefix/suffix symbol support.
- **Alpha Formatting**: Built-in support for alphabetical inputs with space handling.
- **UX Improvements**: 
  - Enhanced cursor stability during typing.
  - Improved backspace handling for currency fields with suffixes.
  - Prevented validation errors from triggering immediately while typing.
- **Customization**: Options for `allowedChars`, `forbiddenChars`, `transform`, and detailed currency configuration.
