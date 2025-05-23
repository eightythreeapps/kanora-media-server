# Theming in Kanora Web App

This document outlines how theming is implemented in the Kanora web application using ShadCN UI and `next-themes`.

## Overview

The application supports:

- Light mode
- Dark mode
- System preference detection
- Custom accent colors

Theming is primarily managed through CSS variables defined in `apps/web/src/styles.css` and configured in `apps/web/tailwind.config.js`.

## Key Files

- `apps/web/components.json`: ShadCN UI configuration, including paths to Tailwind config and global CSS.
- `apps/web/tailwind.config.js`: Tailwind CSS configuration. Extended to include theme-specific colors, border radius, and animations for ShadCN components.
- `apps/web/src/styles.css`: Global stylesheet where CSS variables for light and dark themes, as well as custom accent colors (e.g., chart colors), are defined.
- `apps/web/src/lib/utils.ts`: Contains the `cn` utility function for merging Tailwind classes, essential for constructing component class names.
- `apps/web/src/components/ThemeProvider.tsx`: React component that wraps the application to provide theming context using `next-themes`.
- `apps/web/src/components/ThemeToggle.tsx`: UI component allowing users to switch between light, dark, and system themes.
- `apps/web/src/app/app.tsx`: The main application component where `ThemeProvider` is instantiated to wrap the entire application.

## How Theming Works

1.  **CSS Variables**: Base colors, primary, secondary, accent, destructive, etc., are defined as HSL (Hue, Saturation, Lightness) CSS variables in `apps/web/src/styles.css` for both `:root` (light theme) and `.dark` (dark theme) selectors.

    ```css
    /* Example from styles.css */
    :root {
      --background: 0 0% 100%;
      --foreground: 240 10% 3.9%;
      /* ... other light theme variables ... */
      --radius: 0.5rem;
    }

    .dark {
      --background: 240 10% 3.9%;
      --foreground: 0 0% 98%;
      /* ... other dark theme variables ... */
    }
    ```

2.  **Tailwind Configuration**: `tailwind.config.js` is configured to use these CSS variables.

    ```javascript
    // Example from tailwind.config.js
    // ...
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ... other color definitions ...
      },
      borderRadius: {
        lg: "var(--radius)",
        // ...
      },
    }
    // ...
    ```

3.  **`next-themes` Integration**: The `ThemeProvider` component utilizes `next-themes` to manage theme state (light, dark, system) and applies the corresponding class (e.g., `dark`) to the `<html>` element. This triggers the CSS variable overrides for the dark theme.

4.  **Theme Toggle**: The `ThemeToggle` component uses the `useTheme` hook from `next-themes` to change the current theme.

## Extending the Theming System

### Adding New Colors

1.  **Define CSS Variables**: Add new CSS variables for your color in `apps/web/src/styles.css` for both `:root` and `.dark` selectors.

    ```css
    /* In apps/web/src/styles.css */
    :root {
      /* ... existing variables ... */
      --my-new-color: HSL_VALUES_FOR_LIGHT_THEME;
      --my-new-color-foreground: HSL_VALUES_FOR_LIGHT_THEME_FOREGROUND;
    }

    .dark {
      /* ... existing variables ... */
      --my-new-color: HSL_VALUES_FOR_DARK_THEME;
      --my-new-color-foreground: HSL_VALUES_FOR_DARK_THEME_FOREGROUND;
    }
    ```

2.  **Update Tailwind Config**: Add the new color to your `apps/web/tailwind.config.js`.

    ```javascript
    // In apps/web/tailwind.config.js
    // ...
    extend: {
      colors: {
        // ... existing colors ...
        myNewColor: {
          DEFAULT: "hsl(var(--my-new-color))",
          foreground: "hsl(var(--my-new-color-foreground))",
        },
      },
    }
    // ...
    ```

3.  **Usage**: You can now use this color in your components via Tailwind utility classes (e.g., `bg-myNewColor`, `text-myNewColor-foreground`).

### Modifying Existing Themes

- To change base colors for light or dark themes, modify the HSL values of the corresponding CSS variables in `apps/web/src/styles.css`.
- To change the default radius for components, update the `--radius` CSS variable.

## Adding ShadCN Components

Use the ShadCN CLI to add new UI components. Ensure you are in the `apps/web` directory when running the command:

```bash
cd apps/web
npx shadcn@latest add <component-name>
```

This will automatically add the component files to `apps/web/src/components/ui` and install any necessary dependencies.
