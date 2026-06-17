# eslint-plugin-next-css-order

A unified ESLint plugin and build-phase CLI checker to detect and prevent Next.js App Router **"Inconsistent CSS Resolution Order"** layout shifts.

## The Problem

Developers utilizing the Next.js App Router frequently report that CSS modules and global stylesheets load in a different order in development (using Turbopack) compared to production (compiled via Webpack).

This discrepancy arises because the order of CSS rules in the compiled CSS chunk depends on the ES module evaluation order of JS/TS files. When different entry points (e.g. routes/layouts) import the same components in different relative orders, Webpack cannot resolve a deterministic sequence for CSS concatenation, triggering a `Conflicting order` warning during compilation and causing unexpected layout overrides to slip into production unnoticed.

For details, see the community discussions on the [Next.js Inconsistent CSS Resolution Issue #64921](https://github.com/vercel/next.js/issues/64921).

## Our Solution

This package provides a dual-force tool:
1. **A Build-Phase CLI Tool (`next-css-order-check`)**: Builds the project-wide dependency import graph starting from Next.js entry points (pages and layouts), simulates ES module evaluation order, and visualizes the exact import chains responsible for CSS resolution conflicts.
2. **An ESLint Plugin (`eslint-plugin-next-css-order`)**: Protects your codebase in real-time as you write code, flagging files that violate cascade priorities or introduce import order conflicts.

---

## Installation

```bash
npm install --save-dev eslint-plugin-next-css-order
```

---

## 🚀 CLI Tool (`next-css-order-check`)

Run the scanner in your project root to audit your entire import graph:

```bash
npx next-css-order-check
```

### Options

* `-p, --project <dir>`: Path to the project root directory (defaults to current working directory).
* `-h, --help`: Show help instructions.

### Sample Output

If a conflict is detected, the CLI prints color-coded, visual import trace paths and exits with status code `1` (perfect for pre-commit hooks and CI/CD pipelines):

```text
🔍 Scanning project for CSS Resolution Order conflicts...
Project root: /Users/username/my-next-app
Found 6 entry points (pages/layouts).

❌ Detected 1 CSS Resolution Order conflicts!

Conflict #1:
  CSS File A: components/A.module.css
  CSS File B: components/B.module.css

  - Under Route / (app/page.tsx):
    Order: A.module.css evaluates BEFORE B.module.css
    Import Path to A.module.css:
      app/page.tsx
        └─► components/ComponentA.tsx
          └─► components/A.module.css
    Import Path to B.module.css:
      app/page.tsx
        └─► components/ComponentB.tsx
          └─► components/B.module.css

  - Under Route /settings (app/settings/page.tsx):
    Order: B.module.css evaluates BEFORE A.module.css
    Import Path to B.module.css:
      app/settings/page.tsx
        └─► components/ComponentB.tsx
          └─► components/B.module.css
    Import Path to A.module.css:
      app/settings/page.tsx
        └─► components/ComponentA.tsx
          └─► components/A.module.css
```

---

## 🛠️ ESLint Plugin Configuration

The plugin fully supports ESLint's modern **Flat Configuration** format (`eslint.config.js`).

### Recommended Setup

Add the plugin to your `eslint.config.js`:

```javascript
import nextCssOrder from "eslint-plugin-next-css-order";

export default [
  // Extend recommended rules
  nextCssOrder.configs.recommended,

  // Custom configuration (Optional override)
  {
    plugins: {
      "next-css-order": nextCssOrder,
    },
    rules: {
      "next-css-order/globals-first": "error",
      "next-css-order/no-conflicting-css-order": "error",
    },
  },
];
```

---

## 📏 ESLint Rules

### 1. `next-css-order/globals-first`
**Severity: Error/Warning**

Ensures that global stylesheets (e.g., `globals.css`, `reset.css`, `base.css`) are imported at the absolute top of the file, preceding any local component or module imports.

#### ❌ Incorrect
```tsx
// app/layout.tsx
import Header from '@/components/Header';
import '../globals.css'; // Error: Global CSS must be imported before component imports
```

#### ✅ Correct
```tsx
// app/layout.tsx
import '../globals.css'; // Global reset/base styles first
import Header from '@/components/Header'; // Components next
```

### 2. `next-css-order/no-conflicting-css-order`
**Severity: Error**

Performs a cached, project-wide dependency graph traversal to ensure the relative evaluation order of CSS modules remains consistent across all layout and page trees.

If a file contains imports that cause a resolution sequence conflict, the rule points to the exact import statement that splits the path and explains which route has the opposite sequence.

---

## 💡 How to Fix CSS Order Conflicts

1. **Standardize Import Sequences**:
   Always import your components in the same order across different files.
   * *Bad:* Page A imports `ComponentA` then `ComponentB`; Page B imports `ComponentB` then `ComponentA`.
   * *Good:* Standardize on `ComponentA` then `ComponentB` everywhere.
2. **Move Global Imports to the Top**:
   Ensure all layouts load global stylesheets first, guaranteeing base rules are declared before component-specific modules.
3. **Use CSS Cascade Layers (`@layer`)**:
   Wrap your base styles and component styles in explicit cascade layers. This ensures specificity order is enforced regardless of module evaluation order:
   ```css
   @layer base, components;
   
   @layer base {
     /* Global reset rules */
     body { background: white; }
   }
   
   @layer components {
     /* Component-specific modules */
     .card { background: blue; }
   }
   ```
4. **Avoid Order-Dependent Specificity Overlaps**:
   Ensure class name selectors in your CSS modules do not clash or rely on source-order override wars. Use scoped modules or BEM conventions.

---

## License

MIT
