# Changelog

## [v1.1.0] - 2026-08-01

### Breaking Changes

- **Currency default locale**: Preset and helper defaults are now **US/English** (`1,234.56` — thousand `,`, decimal `.`). Turkish (`1.234,56` / `₺`) is an options override.
- **Phone default mask**: Preset `phone` is now NANP-style `(999) 999-9999`. Turkey grouping `(999) 999 99 99` is a mask override on the `phone` preset.

### Bug Fixes

- **IME / dead-key lock**: Recover when `compositionstart` fires without `compositionend` (e.g. `^` on dead-key layouts). `onChange` trusts `nativeEvent.isComposing`, clears a stuck flag, and resets composition state on blur.
- **Raw value pollution on blur**: `rawValue` / form state no longer pick up masked DOM values (spaces, parentheses) after blur when using `register`. Canonical raw is kept in an internal ref and re-asserted on blur.
- **Mask raw literals**: Card/phone/etc. raw values are scrubbed with `allowedChars` so mask literals never remain in form state.
- **Dependent CVV length**: When card type changes from Amex (4-digit CVV) to a non-Amex card, CVV `rawValue` and form state truncate to 3 digits (not only the display value).
- **Mixed custom masks**: Masks that combine letter and digit slots (e.g. `aaa-999`) no longer strip letters via a digits-only allowlist.

### Improvements

- **`rawValuesRef` source of truth**: Display formatting and sibling `resolveMask` lookups prefer canonical raw over possibly masked form/DOM values.
- **`syncDependentRaws`**: After a field updates, sibling fields with `resolveMask` (e.g. CVV) are re-processed immediately.

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
