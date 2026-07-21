<div align="center">
  <img src="./public/mask.jpg" alt="Vira Stack Mask" />
</div>

<br />

<div align="center">
  <a href="https://www.npmjs.com/package/@virastack/mask">
    <img src="https://img.shields.io/npm/v/@virastack/mask" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@virastack/mask">
    <img src="https://img.shields.io/npm/dt/@virastack/mask" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@virastack/mask">
    <img src="https://img.shields.io/bundlephobia/minzip/@virastack/mask" alt="bundle size" />
  </a>
</div>

<br />

# ViraStack Input Mask

The lightweight standard for input formatting and state synchronization in React.

- 🚀 **Ultra-lightweight:** Less than 5KB minified & zipped.
- ⚛️ **React-First:** Seamless integration with React Hook Form.
- 🛡️ **Type-Safe:** Built with TypeScript for an excellent developer experience.
- 🧠 **Smart Presets:** Built-in masks for credit cards, phones, currency, and more.

### [Read the docs →](https://virastack.com/mask/)

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
      <input {...phone} placeholder="(555) 555 55 55" />
    </form>
  );
}
```

## Explore the ViraStack Ecosystem

Discover all ViraStack tools, libraries, and boilerplates at [**virastack.com**](https://virastack.com).

## License

Licensed under the <a href="https://github.com/virastack/mask/blob/main/LICENSE">MIT License</a>.

## Maintainer

A project by [**Ömer Gülçiçek**](https://omergulcicek.com)

[![Follow Ömer Gülçiçek](https://img.shields.io/github/followers/omergulcicek?label=Follow&style=social)](https://github.com/omergulcicek)