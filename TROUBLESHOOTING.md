# Troubleshooting Guide

## Tailwind CSS Not Processing / Styles Not Appearing

### Problem
- Page displays with white background instead of dark theme
- CSS file contains raw `@tailwind` directives instead of utility classes
- Body has transparent background, no styling applied

### Root Cause
Tailwind CSS v3.3.0 had a critical bug where `@tailwind` directives weren't being processed into utility classes. PostCSS config format also matters for Next.js 14 compatibility.

### Solution
1. **Upgrade Tailwind CSS and dependencies:**
   ```bash
   pnpm install tailwindcss@^3.4.17 postcss@^8.5.6 autoprefixer@^10.4.22
   ```

2. **Ensure PostCSS config is CommonJS format:**
   - File must be named `postcss.config.js` (not `.mjs`)
   - Must use `module.exports` (not `export default`)
   
   ```javascript
   module.exports = {
     plugins: {
       tailwindcss: {},
       autoprefixer: {},
     },
   }
   ```

3. **Clear all caches:**
   ```bash
   rm -rf .next node_modules/.cache
   ```

4. **Restart dev server:**
   ```bash
   pnpm dev
   ```

### Verification
Check that CSS file contains utility classes:
- Should have 200+ utility classes (not just 4)
- CSS file size should be 30KB+ (not 2KB)
- Should contain `.bg-black`, `.text-white`, `.min-h-screen` etc.

### Prevention
Always use minimum versions:
- `tailwindcss: "^3.4.17"` (v3.3.x is broken)
- `postcss: "^8.5.6"`
- `autoprefixer: "^10.4.22"`

PostCSS config must be CommonJS for Next.js 14 compatibility.

---

## Other Common Issues

*Add more troubleshooting entries here as needed*

