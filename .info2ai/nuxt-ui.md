This Markdown file contains the documentation for **Nuxt UI v4** (compatible with Nuxt 4), tailored for an AI agent's usage.

**Note on "Pro" vs. "Normal":**
In **Nuxt UI v4**, the library was unified. Features that were previously paid/Pro (like specific page layouts or dashboard components) are now often included or restructured into the main library. The documentation below focuses on the **standard core components** (atoms and molecules like Buttons, Inputs, Modals) which constitute the "Normal" usage you requested.

---

```markdown
# Nuxt UI v4 Documentation

## 1. Overview
Nuxt UI v4 is a module for Nuxt 4 that provides a set of Vue components styled with Tailwind CSS. It unifies the previous "Core" and "Pro" libraries into a single, comprehensive free library.

* **Framework**: Nuxt 4
* **Styling**: Tailwind CSS
* **Prefix**: Components default to the `U` prefix (e.g., `<UButton>`).

## 2. Installation (Nuxt 4)

Add the module to your Nuxt 4 project.

### Step 1: Install Dependencies
```bash
# Using npm
npm install @nuxt/ui

# Using pnpm
pnpm add @nuxt/ui

# Using yarn
yarn add @nuxt/ui

```

### Step 2: Configure `nuxt.config.ts`

Add `@nuxt/ui` to the `modules` array.

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    '@nuxt/ui'
  ],
  // Optional: CSS configuration if you have custom styles
  css: [
    '~/assets/css/main.css'
  ]
})

```

### Step 3: Tailwind CSS Configuration (Optional)

Nuxt UI automatically configures Tailwind. If you need a `tailwind.config.ts`, it extends the Nuxt UI config automatically.

## 3. General Usage

Components are **auto-imported**. You do not need to import them manually in your Vue files.

### Basic Component Syntax

```vue
<template>
  <UButton label="Click me" color="primary" variant="solid" />
</template>

```

### Colors & Theming

Nuxt UI uses semantic colors (primary, secondary, success, info, warning, error, neutral).

**Customize in `app.config.ts`:**

```typescript
// app.config.ts
export default defineAppConfig({
  ui: {
    primary: 'green',
    gray: 'cool'
  }
})

```

## 4. Component Reference (Standard/Core)

Below is the list of standard UI components available in Nuxt UI v4, categorized by function.

### A. Elements (Basic Building Blocks)

* **`<UAvatar>`**: User profile image/initials.
* **`<UBadge>`**: Small status indicator or label.
* **`<UButton>`**: Interactive button (supports icons, variants, loading states).
* **`<UIcon>`**: Displays icons (Iconify integration).
* **`<UKbd>`**: Keyboard shortcut display (e.g., Ctrl+K).
* **`<UProgress>`**: Progress bar/meter.
* **`<USeparator>`** (or `<UDivider>`): Horizontal or vertical line to separate content.
* **`<USkeleton>`**: Loading placeholder for content.

### B. Forms (Data Entry)

* **`<UInput>`**: Text input field.
* **`<UTextarea>`**: Multiline text input.
* **`<UCheckbox>`**: Box for binary choice.
* **`<UCheckboxGroup>`**: Group of checkboxes.
* **`<URadioGroup>`**: Group of radio buttons (single selection).
* **`<USwitch>`** (or `<UToggle>`): Toggle switch.
* **`<USlider>`** (or `<URange>`): Range slider input.
* **`<USelect>`**: Native select dropdown.
* **`<USelectMenu>`**: Custom styled select dropdown with search/filtering.
* **`<UInputMenu>`**: Input with an autocomplete dropdown menu.
* **`<UInputDate>`** / **`<UInputTime>`**: Date and time pickers.
* **`<UPinInput>`**: Segmented input for OTP/Pins.
* **`<UFormField>`** (or `<UFormGroup>`): Wrapper for labels, help text, and error messages.
* **`<UForm>`**: Form container for validation and submission handling.

### C. Data & Display

* **`<UCard>`**: Container with header, body, and footer slots.
* **`<UTable>`**: Responsive data table with sorting and selection.
* **`<UAccordion>`**: Collapsible content sections.
* **`<UCarousel>`**: Slider/carousel for images or content.
* **`<UEmpty>`**: Placeholder for empty states.
* **`<UScrollArea>`**: Container with custom scrollbars.
* **`<UTimeline>`**: Vertical list of events/steps.

### D. Navigation

* **`<UCommandPalette>`**: Command menu (Cmd+K) for search and actions.
* **`<ULink>`**: Wrapper around NuxtLink with styling options.
* **`<UNavigationMenu>`**: Horizontal or vertical list of navigation links.
* **`<UPagination>`**: Navigation for paginated data.
* **`<UStepper>`**: Step-by-step progress indicator.
* **`<UBreadcrumb>`**: Path of links showing current location.
* **`<UTabs>`**: Tabbed interface to switch views.

### E. Overlays (Popups & Floating Elements)

* **`<UModal>`**: Dialog box overlaying the page.
* **`<USlideover>`**: Panel sliding in from the side (drawer).
* **`<UPopover>`**: Floating panel attached to an element (click trigger).
* **`<UTooltip>`**: Small info popup on hover.
* **`<UDropdownMenu>`**: Dropdown menu for actions.
* **`<UContextMenu>`**: Right-click menu.
* **`<UToast>`**: Notification message (requires `useToast()` composable).

## 5. Essential Composables

### `useToast()`

Used to trigger notifications.

```vue
<script setup>
const toast = useToast()

function save() {
  toast.add({ title: 'Success', description: 'Item saved!' })
}
</script>

```

### `defineShortcuts()`

Bind keyboard shortcuts easily.

```vue
<script setup>
defineShortcuts({
  meta_k: () => {
    console.log('Opened command palette')
  }
})
</script>

```

## 6. Icon Usage

Nuxt UI uses `@nuxt/icon`. You can use any Iconify set.
Format: `i-{collection}-{name}`
Example: `i-heroicons-home`, `i-lucide-arrow-right`.

```vue
<UButton icon="i-heroicons-pencil-square" label="Edit" />

```

```

```
