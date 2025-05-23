# 🎨 UI Redesign PRD: Music Server App with ShadCN

## 🧭 Overview

This PRD defines the scope of work for redesigning the Music Server App’s UI using [ShadCN](https://ui.shadcn.com). The existing UI is too corporate and rigid. The goal is a modern, minimal, music-first experience with support for light and dark modes.

## 🛠️ Technologies

- **React + TypeScript**
- **Tailwind CSS**
- **ShadCN UI (Radix-based)**
- **Lucide Icons**
- **Framer Motion (optional for transitions)**
- **React Router or Next.js**

---

## 🎯 Objectives

- Replace the login, registration, and dashboard UI
- Implement responsive design with ShadCN components
- Fully support light/dark themes via ShadCN's theming
- Improve usability and accessibility
- Provide clean separation of layout and content

---

## 📋 Task Breakdown

### 🧾 Ticket: Redesign Login Screen

**Description**  
Replace the current login UI with a sleek, centered layout using ShadCN components.

**Checklist**

- [ ] Use `<Card>`, `<Input>`, `<Button>`
- [ ] Email and password fields with validation
- [ ] “Forgot password?” link
- [ ] Login button (disabled until valid)
- [ ] Link to create account
- [ ] Responsive design
- [ ] Light/Dark theme toggle
- [ ] Accessibility support (labels, keyboard nav)

**Optional**

- [ ] Background gradient or artwork blur
- [ ] Framer Motion for transitions

**Labels:** `ui`, `login`, `shadcn`, `light-dark-mode`

---

### 🧾 Ticket: Rebuild Account Creation Screen

**Description**  
Modernize the account registration screen using ShadCN. Focus on friendliness, validation, and responsiveness.

**Checklist**

- [ ] Use `<Form>`, `<Input>`, `<Label>`, `<Button>`
- [ ] Fields: Name, Email, Password, Confirm Password
- [ ] Toggle for password visibility
- [ ] Inline validation errors
- [ ] Redirect to login screen
- [ ] Mobile-friendly layout
- [ ] Full theme support
- [ ] Accessible form labels and inputs

**Optional**

- [ ] Multi-step form (future-proof)
- [ ] Animate success state
- [ ] System profile name prefill (optional)

**Labels:** `ui`, `register`, `shadcn`, `accessibility`

---

### 🧾 Ticket: Build Dashboard Screen

**Description**  
Design and implement a beautiful dashboard experience focused on music playback and management.

**Checklist**

- [ ] Top nav with:
  - [ ] User avatar dropdown
  - [ ] Theme toggle
  - [ ] Library refresh
- [ ] Sidebar navigation:
  - Home, Artists, Albums, Playlists, Settings
- [ ] Main area:
  - Welcome message (e.g., “Good Evening, Alex”)
  - Recently played items
  - Responsive album/track grid
- [ ] Persistent music player dock
- [ ] Skeleton loading states
- [ ] Fully responsive
- [ ] Light/Dark mode

**Optional**

- [ ] Glassmorphic effects
- [ ] Animations for tab/view transitions

**Labels:** `ui`, `dashboard`, `music`, `shadcn`

---

## 🎨 Theming Requirements

- Use ShadCN’s theming config to enable light/dark modes
- Expose theme toggle in the UI (`<ThemeToggle />`)
- Respect system theme preference by default
- Allow custom accent color config via Tailwind tokens

---

## 📁 Folder Structure Suggestions
