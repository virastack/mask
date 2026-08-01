<div align="center">

<a href="https://github.com/virastack/mask" target="_blank" rel="noreferrer">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/virastack/mask/main/assets/logo-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/virastack/mask/main/assets/logo-light.png">
    <img src="https://raw.githubusercontent.com/virastack/mask/main/assets/logo-light.png" alt="ViraStack Mask" height="120" style="max-width: 100%;" />
  </picture>
</a>

*The lightweight standard for input formatting and state synchronization in React.*

[![ViraStack Mask](https://img.shields.io/badge/ViraStack-Mask-%23615fff)](https://virastack.com/mask/)
[![npm version](https://img.shields.io/npm/v/@virastack/mask)](https://www.npmjs.com/package/@virastack/mask)
[![npm downloads](https://img.shields.io/npm/dt/@virastack/mask)](https://www.npmjs.com/package/@virastack/mask)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@virastack/mask)](https://bundlephobia.com/package/@virastack/mask)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/virastack/mask/blob/main/LICENSE)
[![@virastack](https://img.shields.io/badge/-%40virastack-black?logo=x&logoColor=white)](https://x.com/virastack)

</div>

---

### [Read the full documentation →](https://virastack.com/mask/)

## Why ViraStack Mask?

- **Ultra-lightweight:** Less than 5KB minified & zipped, minimizing your bundle size.
- **React-First:** Seamless integration with React Hook Form, eliminating state synchronization issues.
- **Type-Safe:** Built with TypeScript for an excellent developer experience and robust autocompletion.
- **Smart Presets:** Built-in masks for credit cards, phones, currency, and more, saving you development time.

## Quick Start

```bash
npm install @virastack/mask
```

```tsx
import { useForm } from 'react-hook-form';
import { useViraMask } from '@virastack/mask';

function App() {
  const form = useForm();
  
  const { phone } = useViraMask({
    form,
    schema: {
      phone: 'phone'
    }
  });

  return (
    <form>
      <input {...phone} placeholder="(555) 555-5555" />
    </form>
  );
}
```

## Explore the ViraStack Ecosystem

Discover all ViraStack tools, libraries, and boilerplates at [**virastack.com**](https://virastack.com).

## License

Licensed under the [MIT License](https://github.com/virastack/mask/blob/main/LICENSE).

## Maintainer

A project by [**Ömer Gülçiçek**](https://omergulcicek.com)

[![Follow Ömer Gülçiçek](https://img.shields.io/github/followers/omergulcicek?label=Follow&style=social)](https://github.com/omergulcicek)
