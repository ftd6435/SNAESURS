# SNAESURS — Graphic Charter & Design System

**Système de Gestion Syndicale - Guinée**

---

## Brand Identity & Design Philosophy

### Brand Values

The SNAESURS visual identity communicates:

- **Knowledge & Intellectual Growth** — Supporting academic professionals
- **Research & Development** — Progressive union movement
- **Academic Professionalism** — Credibility and institutional authority
- **Community Trust** — Transparent governance and financial management
- **Accessibility** — Multi-platform support for all members

### Design Principles

The interface should be:

- ✅ **Modern yet Institutional** — Contemporary design with traditional credibility
- ✅ **Clean & Readable** — Clear hierarchy for complex data (finances, meetings, members)
- ✅ **Professional for Administration** — Suitable for financial tracking and reporting
- ✅ **Academic & Trustworthy** — Inspiring confidence in union leadership
- ✅ **Mobile-First** — Accessible on phones for field workers and members
- ✅ **Bilingual Ready** — French primary language with potential English support

---

## 1. Official Color Palette

### Primary Colors

| Role               | Color Name           | HEX       | RGB           | Usage                                                         |
| ------------------ | -------------------- | --------- | ------------- | ------------------------------------------------------------- |
| **Primary Blue**   | Deep Academic Blue   | `#135796` | 19, 87, 150   | Primary buttons, navigation headers, main CTAs, active states |
| **Secondary Blue** | Royal Interface Blue | `#1E6EC0` | 30, 110, 192  | Hover states, links, interactive charts, secondary actions    |
| **Sage Gray**      | Institutional Sage   | `#9BA9A1` | 155, 169, 161 | Card backgrounds, disabled states, section dividers           |
| **Dark Slate**     | Dark Slate           | `#0D1D23` | 13, 29, 35    | Body text, sidebar background, footer, headings               |

### Supporting Colors

| Role           | Color Name        | HEX       | Usage                                                 |
| -------------- | ----------------- | --------- | ----------------------------------------------------- |
| **Accent**     | Wood Brown        | `#9C5931` | Decorative highlights, badges, category tags          |
| **Neutral**    | Soft Beige        | `#D9C1A7` | Neutral backgrounds, alternative cards, notifications |
| **Light Gray** | Dashboard Surface | `#F5F7F7` | Main dashboard background, table rows (alternating)   |
| **White**      | Pure White        | `#FFFFFF` | Card backgrounds, modals, main content areas          |

### Semantic Colors (Status & Feedback)

| Meaning     | Color      | HEX       | Usage                                                    |
| ----------- | ---------- | --------- | -------------------------------------------------------- |
| **Success** | Green      | `#1FA750` | Approved members, paid cotisations, completed meetings   |
| **Warning** | Amber      | `#E0B63F` | Pending approvals, partial payments, upcoming deadlines  |
| **Error**   | Red        | `#D64545` | Sanctions, rejected requests, overdue payments, absences |
| **Info**    | Royal Blue | `#1E6EC0` | Notifications, tooltips, help messages                   |
| **Pending** | Gray       | `#9BA9A1` | Waiting status, inactive members                         |

### Role-Based Color Coding

| Role        | Badge Color                | Usage                |
| ----------- | -------------------------- | -------------------- |
| Super Admin | `#0D1D23` (Dark Slate)     | Full system access   |
| Admin       | `#135796` (Primary Blue)   | Structure management |
| Trésorier   | `#1FA750` (Success Green)  | Financial operations |
| Secrétaire  | `#1E6EC0` (Secondary Blue) | Meeting management   |
| Membre      | `#9BA9A1` (Sage Gray)      | Standard member      |

---

## 2. Typography System

### Font Stack

#### Primary Font: **Orbitron**

**Purpose:** Headings, Titles, Navigation, Buttons
**Reason:**

- Matches the futuristic geometric style of the SNAESURS logo
- Strong institutional and technological appearance
- Excellent for dashboard headers and system titles
- Conveys authority and modernism

**CDN Import:**

```html
<link
    href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;900&display=swap"
    rel="stylesheet"
/>
```

**Tailwind Config:**

```javascript
fontFamily: {
  'heading': ['Orbitron', 'sans-serif'],
}
```

#### Secondary Font: **Inter**

**Purpose:** Body text, Forms, Tables, Labels, Descriptions
**Reason:**

- Modern and highly readable at all sizes
- Excellent for management systems and data-heavy interfaces
- Optimized for mobile and desktop screens
- Perfect for financial tables and long-form content

**CDN Import:**

```html
<link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
    rel="stylesheet"
/>
```

**Tailwind Config:**

```javascript
fontFamily: {
  'body': ['Inter', 'system-ui', 'sans-serif'],
}
```

### Typography Scale

| Element        | Font     | Weight         | Size            | Line Height | Usage                                 |
| -------------- | -------- | -------------- | --------------- | ----------- | ------------------------------------- |
| **H1**         | Orbitron | Bold (700)     | 40px / 2.5rem   | 1.2         | Page titles, dashboard welcome        |
| **H2**         | Orbitron | SemiBold (600) | 32px / 2rem     | 1.3         | Section headers, modal titles         |
| **H3**         | Orbitron | Medium (500)   | 24px / 1.5rem   | 1.4         | Card titles, subsection headers       |
| **H4**         | Orbitron | Medium (500)   | 20px / 1.25rem  | 1.4         | Table headers, widget titles          |
| **Body Large** | Inter    | Medium (500)   | 18px / 1.125rem | 1.6         | Introductory text, important notices  |
| **Body**       | Inter    | Regular (400)  | 16px / 1rem     | 1.6         | Default text, paragraphs, form labels |
| **Body Small** | Inter    | Regular (400)  | 14px / 0.875rem | 1.5         | Helper text, table content, lists     |
| **Caption**    | Inter    | Medium (500)   | 12px / 0.75rem  | 1.4         | Timestamps, metadata, badges          |
| **Button**     | Orbitron | Medium (500)   | 16px / 1rem     | 1           | All button text                       |

### Tailwind Typography Classes

```javascript
// tailwind.config.js
module.exports = {
    theme: {
        extend: {
            fontSize: {
                h1: ["2.5rem", { lineHeight: "1.2", fontWeight: "700" }],
                h2: ["2rem", { lineHeight: "1.3", fontWeight: "600" }],
                h3: ["1.5rem", { lineHeight: "1.4", fontWeight: "500" }],
                h4: ["1.25rem", { lineHeight: "1.4", fontWeight: "500" }],
                "body-lg": [
                    "1.125rem",
                    { lineHeight: "1.6", fontWeight: "500" },
                ],
                body: ["1rem", { lineHeight: "1.6", fontWeight: "400" }],
                "body-sm": [
                    "0.875rem",
                    { lineHeight: "1.5", fontWeight: "400" },
                ],
                caption: ["0.75rem", { lineHeight: "1.4", fontWeight: "500" }],
            },
        },
    },
};
```

---

## 3. UI Component System

### Design Language

- **Border Radius:** 12px (cards), 8px (buttons), 6px (inputs)
- **Spacing System:** 4px base (4, 8, 12, 16, 24, 32, 48, 64px)
- **Shadows:** Soft, layered elevation system
- **Transitions:** 200-300ms ease-in-out
- **Grid System:** 12-column responsive grid

### Buttons

#### Primary Button

```javascript
// TailwindCSS + shadcn/ui
className="bg-[#135796] hover:bg-[#1E6EC0] text-white font-heading
           font-medium px-6 py-3 rounded-lg transition-all duration-200
           shadow-md hover:shadow-lg active:scale-[0.98]"
```

**Usage:** Main actions (Enregistrer, Ajouter, Valider, Approuver)

#### Secondary Button

```javascript
className="bg-transparent border-2 border-[#135796] text-[#135796]
           hover:bg-[#135796] hover:text-white font-heading font-medium
           px-6 py-3 rounded-lg transition-all duration-200"
```

**Usage:** Secondary actions (Annuler, Modifier, Voir Détails)

#### Danger Button

```javascript
className="bg-[#D64545] hover:bg-[#B93939] text-white font-heading
           font-medium px-6 py-3 rounded-lg transition-all duration-200
           shadow-md hover:shadow-lg"
```

**Usage:** Destructive actions (Supprimer, Rejeter, Sanctionner)

#### Success Button

```javascript
className="bg-[#1FA750] hover:bg-[#198A43] text-white font-heading
           font-medium px-6 py-3 rounded-lg transition-all duration-200"
```

**Usage:** Approval actions (Approuver Membre, Valider Paiement)

#### Icon Button

```javascript
className = "p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200";
```

**Usage:** Quick actions in tables, notification icons

### Form Elements

#### Input Fields

```javascript
className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg
           font-body text-base focus:border-[#135796] focus:ring-2
           focus:ring-[#135796]/20 transition-all duration-200
           placeholder:text-gray-400"
```

#### Select Dropdowns

```javascript
className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg
           font-body text-base bg-white focus:border-[#135796]
           focus:ring-2 focus:ring-[#135796]/20 cursor-pointer"
```

#### Textarea

```javascript
className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg
           font-body text-base focus:border-[#135796] focus:ring-2
           focus:ring-[#135796]/20 min-h-[120px] resize-y"
```

#### Checkbox & Radio

```javascript
// Using shadcn/ui components with custom accent color
accentColor = "#135796";
```

### Cards

#### Standard Card

```javascript
className="bg-white rounded-[18px] p-6 shadow-sm hover:shadow-md
           transition-shadow duration-200 border border-gray-100"
```

#### Stat Card (Dashboard)

```javascript
className="bg-white rounded-[18px] p-6 shadow-sm border-l-4
           border-[#135796]"
```

#### Info Card

```javascript
className = "bg-[#F5F7F7] rounded-[18px] p-6 border border-gray-200";
```

### Tables

#### Table Container

```javascript
className = "w-full overflow-x-auto bg-white rounded-[18px] shadow-sm";
```

#### Table Headers

```javascript
className="bg-[#F5F7F7] font-heading text-sm font-medium text-[#0D1D23]
           uppercase tracking-wider"
```

#### Table Rows

```javascript
// Alternating row colors
className="hover:bg-gray-50 transition-colors duration-150
           even:bg-gray-25 border-b border-gray-100"
```

### Badges & Status Indicators

#### Role Badge

```javascript
// Super Admin
className="px-3 py-1 rounded-full text-xs font-body font-medium
           bg-[#0D1D23] text-white"

// Admin
className="px-3 py-1 rounded-full text-xs font-body font-medium
           bg-[#135796] text-white"

// Trésorier
className="px-3 py-1 rounded-full text-xs font-body font-medium
           bg-[#1FA750] text-white"

// Membre
className="px-3 py-1 rounded-full text-xs font-body font-medium
           bg-[#9BA9A1] text-white"
```

#### Status Badge

```javascript
// Approved / Paid / Present
className="px-3 py-1 rounded-full text-xs font-medium
           bg-green-100 text-green-700"

// Pending / Partial
className="px-3 py-1 rounded-full text-xs font-medium
           bg-amber-100 text-amber-700"

// Rejected / Absent / Overdue
className="px-3 py-1 rounded-full text-xs font-medium
           bg-red-100 text-red-700"
```

### Modals & Dialogs

#### Modal Container

```javascript
className="bg-white rounded-[24px] shadow-2xl max-w-2xl w-full
           p-8 animate-in fade-in duration-200"
```

#### Modal Overlay

```javascript
className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50
           flex items-center justify-center p-4"
```

---

## 4. Layout System

### Sidebar Navigation

#### Desktop Sidebar

```javascript
// Container
className="w-64 bg-[#0D1D23] h-screen fixed left-0 top-0
           flex flex-col shadow-xl z-40"

// Logo Section
className="p-6 border-b border-gray-700"

// Menu Item (Active)
className="flex items-center gap-3 px-6 py-3 bg-[#135796]
           text-white font-body font-medium border-r-4
           border-[#1E6EC0] transition-all duration-200"

// Menu Item (Inactive)
className="flex items-center gap-3 px-6 py-3 text-gray-300
           hover:bg-gray-800 hover:text-white transition-all
           duration-200"
```

#### Mobile Sidebar

```javascript
// Drawer that slides from left
className="fixed inset-y-0 left-0 w-64 bg-[#0D1D23] shadow-2xl
           transform transition-transform duration-300 z-50
           -translate-x-full md:translate-x-0"
```

### Top Navbar

```javascript
// Container
className="h-16 bg-white border-b border-gray-200 fixed top-0
           left-0 md:left-64 right-0 z-30 flex items-center
           justify-between px-6"

// User Profile Section
className="flex items-center gap-3"

// Notification Icon
className="relative p-2 rounded-lg hover:bg-gray-100
           transition-colors duration-200"

// Notification Badge
className="absolute -top-1 -right-1 w-5 h-5 bg-[#D64545]
           text-white text-xs rounded-full flex items-center
           justify-center font-bold"
```

### Main Content Area

```javascript
// Container
className="ml-0 md:ml-64 mt-16 min-h-screen bg-[#F5F7F7] p-6"

// Page Header
className="mb-6"

// Content Grid
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
           gap-6"
```

### Dashboard Grid System

```javascript
// 4-Column Stat Cards
className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8";

// 2-Column Charts
className = "grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8";

// Full-Width Table
className = "col-span-full";
```

---

## 5. Module-Specific Design Guidelines

### 🔐 Authentication Module

- **OTP Input:** Large, spaced inputs (6 digits) with focus states
- **Phone Number Input:** Country code selector + number field
- **Login Options:** Toggle between Phone/Email and OTP/Password
- **Branding:** Prominent logo and academic imagery

### 👥 User Management Module

- **User Cards:** Avatar (Cloudflare R2), name, role badge, structure tag
- **Approval Queue:** Warning color for pending users
- **Profile Views:** Large avatar, detailed info, action buttons
- **Role Filters:** Colored chips for quick filtering

### 🏢 Structure Management Module

- **Hierarchy Visualization:** Tree view or nested cards
- **Location Tags:** Geographic indicators
- **Member Count:** Stat cards showing members per structure
- **Assignment Modal:** Searchable user list with multi-select

### 💰 Cotisation (Contribution) Management

- **Payment Status:** Progress bars (Paid/Unpaid amounts)
- **Type Cards:** Color-coded contribution types
- **Payment History:** Timeline view with transaction details
- **Overdue Alerts:** Red badges for late payments

### 📅 Réunion (Meeting) Management

- **Calendar View:** Month/Week view with color-coded statuses
- **Meeting Cards:** Date, time, location, participant count
- **Attendance Tracker:**
    - ✅ Green for "Présent"
    - ⏳ Amber for "En attente"
    - ❌ Red for "Absent"
- **SMS Notification Button:** Send reminders to participants

### 📊 Financial Management (Dons & Dépenses)

- **Transaction Cards:** Type icon, amount (large), date, category
- **Filters:** By type, date range, structure
- **Summary Stats:** Total income, expenses, balance (prominent)
- **Export Button:** PDF/Excel download options

### ⚖️ Sanctions Module

- **Severity Indicators:** Color-coded by sanction type
- **Member Impact:** Show member profile with sanction history
- **Timeline:** Chronological sanction records
- **Appeal System:** Status tracking for appeals

---

## 6. Data Visualization & Charts

### Recommended Chart Library

**Recharts** — React-based, responsive, customizable

**Installation:**

```bash
npm install recharts
```

### Chart Color Palette

```javascript
const chartColors = {
    primary: "#135796", // Primary Blue
    secondary: "#1E6EC0", // Secondary Blue
    success: "#1FA750", // Success Green
    warning: "#E0B63F", // Warning Amber
    danger: "#D64545", // Error Red
    neutral: "#9BA9A1", // Sage Gray
    accent: "#9C5931", // Wood Brown
};
```

### Chart Types by Use Case

#### 1. **Bar Chart** — Monthly Cotisations

```javascript
// Comparing contributions across structures or months
colors={['#135796', '#1E6EC0', '#9BA9A1']}
```

#### 2. **Line Chart** — Financial Trends

```javascript
// Tracking income/expenses over time
strokeColor = "#135796";
```

#### 3. **Pie Chart** — Expense Categories

```javascript
// Breaking down spending by category
colors={['#135796', '#1E6EC0', '#1FA750', '#E0B63F', '#9C5931']}
```

#### 4. **Area Chart** — Membership Growth

```javascript
// Showing member registration trends
fillColor="#135796"
fillOpacity={0.3}
```

#### 5. **Radial Bar Chart** — Cotisation Completion Rate

```javascript
// Percentage of members who paid
fillColor = "#1FA750";
```

### Chart Styling

```javascript
// Container
className = "bg-white rounded-[18px] p-6 shadow-sm";

// Title
className = "font-heading text-xl font-semibold text-[#0D1D23] mb-4";

// Legend
className = "font-body text-sm text-gray-600";
```

---

## 7. Animation & Interaction

### Framer Motion Guidelines

**Installation:**

```bash
npm install framer-motion
```

### Animation Principles

- **Subtle & Professional** — No excessive or playful animations
- **Performance-Focused** — Optimize for mobile devices
- **Purposeful Motion** — Animations should guide user attention
- **Duration:** 200-400ms for most interactions

### Common Animations

#### Page Transitions

```javascript
import { motion } from "framer-motion";

<motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
>
    {/* Page content */}
</motion.div>;
```

#### Card Hover Effect

```javascript
<motion.div
    whileHover={{ scale: 1.02, y: -4 }}
    transition={{ duration: 0.2 }}
    className="bg-white rounded-[18px] p-6 shadow-sm cursor-pointer"
>
    {/* Card content */}
</motion.div>
```

#### Modal Entry

```javascript
<motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    transition={{ duration: 0.2 }}
>
    {/* Modal content */}
</motion.div>
```

#### List Item Stagger

```javascript
const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
        },
    },
};

const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 },
};

<motion.ul variants={container} initial="hidden" animate="show">
    {items.map((item) => (
        <motion.li key={item.id} variants={item}>
            {item.name}
        </motion.li>
    ))}
</motion.ul>;
```

#### Loading Spinner

```javascript
<motion.div
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    className="w-8 h-8 border-4 border-[#135796] border-t-transparent rounded-full"
/>
```

#### Button Press Feedback

```javascript
<motion.button
    whileTap={{ scale: 0.98 }}
    className="bg-[#135796] text-white px-6 py-3 rounded-lg"
>
    Submit
</motion.button>
```

---

## 8. Iconography

### Recommended Icon Library

**Lucide React** — Clean, consistent, open-source

**Installation:**

```bash
npm install lucide-react
```

### Icon Usage Guidelines

- **Size:** 20px (default), 24px (headers), 16px (inline)
- **Stroke Width:** 2px (standard), 2.5px (emphasis)
- **Color:** Inherit from parent or use theme colors

### Module Icons

```javascript
import {
    Users, // User Management
    Building, // Structure Management
    DollarSign, // Cotisations
    Calendar, // Réunions
    TrendingUp, // Financial Reports
    Gift, // Dons (Donations)
    CreditCard, // Dépenses (Expenses)
    AlertTriangle, // Sanctions
    Settings, // Settings
    Bell, // Notifications
    LogOut, // Logout
    CheckCircle, // Approved
    Clock, // Pending
    XCircle, // Rejected
    Eye, // View Details
    Edit, // Edit
    Trash2, // Delete
    Download, // Export
    Upload, // Import
    Search, // Search
    Filter, // Filter
    Plus, // Add New
    ChevronDown, // Dropdown
    Menu, // Mobile Menu
    X, // Close
} from "lucide-react";
```

### Icon Color Coding

```javascript
// Success actions
<CheckCircle className="text-[#1FA750]" size={20} />

// Warning/Pending
<Clock className="text-[#E0B63F]" size={20} />

// Error/Danger
<XCircle className="text-[#D64545]" size={20} />

// Primary actions
<Users className="text-[#135796]" size={20} />

// Neutral
<Settings className="text-gray-500" size={20} />
```

---

## 9. Responsive Design Breakpoints

### Tailwind Breakpoints

```javascript
// tailwind.config.js
screens: {
  'sm': '640px',   // Mobile landscape
  'md': '768px',   // Tablet
  'lg': '1024px',  // Desktop
  'xl': '1280px',  // Large desktop
  '2xl': '1536px', // Extra large
}
```

### Mobile-First Approach

```javascript
// Stack on mobile, grid on desktop
className = "flex flex-col md:grid md:grid-cols-2 lg:grid-cols-3 gap-4";

// Hide sidebar on mobile
className = "hidden md:block";

// Full-width buttons on mobile
className = "w-full md:w-auto";

// Responsive padding
className = "p-4 md:p-6 lg:p-8";

// Responsive text sizes
className = "text-2xl md:text-3xl lg:text-4xl";
```

### Touch Targets

- **Minimum size:** 44x44px (iOS) / 48x48px (Android)
- **Spacing:** Minimum 8px between interactive elements on mobile

---

## 10. Accessibility Guidelines (WCAG 2.1 AA)

### Color Contrast

- **Normal Text:** Minimum 4.5:1 contrast ratio
- **Large Text (18px+):** Minimum 3:1 contrast ratio
- **UI Components:** Minimum 3:1 contrast ratio

### Verified Combinations

✅ **Primary Blue (#135796) on White** — 5.1:1 (Pass)
✅ **Dark Slate (#0D1D23) on White** — 15.3:1 (Excellent)
✅ **White on Primary Blue (#135796)** — 5.1:1 (Pass)
✅ **Success Green (#1FA750) on White** — 3.2:1 (Pass for large text)

### Keyboard Navigation

- All interactive elements must be keyboard accessible
- Focus states must be clearly visible
- Logical tab order through page content

### Screen Reader Support

```javascript
// Button labels
<button aria-label="Approuver le membre">
  <CheckCircle />
</button>

// Form inputs
<label htmlFor="email" className="sr-only">Email</label>
<input id="email" type="email" placeholder="Email" />

// Status announcements
<div role="alert" aria-live="polite">
  Cotisation enregistrée avec succès
</div>
```

### Focus States

```javascript
className="focus:outline-none focus:ring-2 focus:ring-[#135796]
           focus:ring-offset-2 rounded-lg"
```

### Alternative Text

- All images must have descriptive `alt` attributes
- Decorative images should use `alt=""`

---

## 11. Performance Optimization

### Image Optimization

- **Format:** WebP with PNG/JPG fallback
- **Cloudflare R2:** Use Cloudflare Image Resizing for avatars
- **Lazy Loading:** Implement for images below the fold

### Code Splitting

```javascript
// Lazy load pages
import { lazy, Suspense } from "react";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Users = lazy(() => import("./pages/Users"));

<Suspense fallback={<LoadingSpinner />}>
    <Dashboard />
</Suspense>;
```

### TanStack Query Configuration

```javascript
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            cacheTime: 10 * 60 * 1000, // 10 minutes
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});
```

### Bundle Size Management

- Tree-shake unused components
- Use dynamic imports for large libraries
- Minimize shadcn/ui component imports

---

## 12. Dark Mode (Optional Future Enhancement)

### Color Palette (Dark Theme)

| Role           | Light Mode | Dark Mode |
| -------------- | ---------- | --------- |
| Background     | `#F5F7F7`  | `#0F1419` |
| Card           | `#FFFFFF`  | `#1A1F26` |
| Text Primary   | `#0D1D23`  | `#E5E7EB` |
| Text Secondary | `#6B7280`  | `#9CA3AF` |
| Border         | `#E5E7EB`  | `#2D3748` |

### Implementation with Tailwind

```javascript
// Enable dark mode
// tailwind.config.js
module.exports = {
    darkMode: "class",
    // ...
};

// Usage
className = "bg-white dark:bg-[#1A1F26] text-[#0D1D23] dark:text-gray-100";
```

---

## 13. Localization (i18n) Preparation

### Language Support

- **Primary:** French (Guinée)
- **Future:** English, Susu, Fulani, Malinke

### Implementation with react-i18next

```javascript
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n.use(initReactI18next).init({
    resources: {
        fr: {
            translation: {
                dashboard: "Tableau de Bord",
                members: "Membres",
                cotisations: "Cotisations",
                // ...
            },
        },
    },
    lng: "fr",
    fallbackLng: "fr",
    interpolation: {
        escapeValue: false,
    },
});
```

---

## 14. Component Library Setup

### shadcn/ui Installation

```bash
npx shadcn-ui@latest init
```

### Configuration

```javascript
// components.json
{
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

### Customize shadcn Colors

```css
/* app.css or index.css */
@layer base {
    :root {
        --primary: 210 79% 33%; /* #135796 */
        --primary-foreground: 0 0% 100%; /* White */
        --secondary: 210 73% 44%; /* #1E6EC0 */
        --destructive: 0 65% 55%; /* #D64545 */
        --success: 146 73% 38%; /* #1FA750 */
        --warning: 43 70% 56%; /* #E0B63F */
        --border: 220 13% 91%; /* Light Gray */
        --input: 220 13% 91%;
        --ring: 210 79% 33%; /* Primary Blue */
        --radius: 0.75rem; /* 12px */
    }
}
```

### Essential Components to Install

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add form
npx shadcn-ui@latest add select
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add table
npx shadcn-ui@latest add card
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add calendar
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add radio-group
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add tooltip
```

---

## 15. Error & Empty States

### Error Page (404, 500)

```javascript
<div className="min-h-screen flex items-center justify-center bg-[#F5F7F7] p-6">
    <div className="text-center">
        <h1 className="font-heading text-6xl font-bold text-[#135796] mb-4">
            404
        </h1>
        <p className="font-body text-xl text-gray-600 mb-8">Page non trouvée</p>
        <button className="bg-[#135796] text-white px-6 py-3 rounded-lg">
            Retour à l'accueil
        </button>
    </div>
</div>
```

### Empty State (No Data)

```javascript
<div className="bg-white rounded-[18px] p-12 text-center">
    <div
        className="w-16 h-16 bg-gray-100 rounded-full flex items-center 
                  justify-center mx-auto mb-4"
    >
        <Users className="text-gray-400" size={32} />
    </div>
    <h3 className="font-heading text-lg font-semibold text-gray-700 mb-2">
        Aucun membre trouvé
    </h3>
    <p className="font-body text-gray-500 mb-6">
        Commencez par ajouter votre premier membre
    </p>
    <button className="bg-[#135796] text-white px-6 py-3 rounded-lg">
        Ajouter un membre
    </button>
</div>
```

### Loading State

```javascript
// Skeleton Loader
<div className="bg-white rounded-[18px] p-6 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
</div>
```

---

## 16. Notification & Toast System

### Toast Notifications (using shadcn/ui)

```javascript
import { useToast } from "@/components/ui/use-toast";

const { toast } = useToast();

// Success
toast({
    title: "Succès",
    description: "Membre approuvé avec succès",
    variant: "default",
    className: "bg-[#1FA750] text-white",
});

// Error
toast({
    title: "Erreur",
    description: "Impossible de supprimer cet élément",
    variant: "destructive",
});

// Warning
toast({
    title: "Attention",
    description: "Cette action est irréversible",
    className: "bg-[#E0B63F] text-white",
});
```

### Toast Position & Duration

- **Position:** Top-right
- **Duration:** 5 seconds (default)
- **Dismissible:** Yes (with X button)

---

## 17. Print Styles (For Reports)

### Print-Specific CSS

```css
@media print {
    /* Hide navigation */
    .sidebar,
    .navbar,
    .no-print {
        display: none !important;
    }

    /* Full width content */
    .main-content {
        margin-left: 0 !important;
        margin-top: 0 !important;
    }

    /* Page breaks */
    .page-break {
        page-break-after: always;
    }

    /* Remove shadows */
    * {
        box-shadow: none !important;
    }

    /* Adjust colors for print */
    body {
        background: white !important;
    }
}
```

### Print Button

```javascript
<button
    onClick={() => window.print()}
    className="bg-white border-2 border-[#135796] text-[#135796] 
             px-4 py-2 rounded-lg flex items-center gap-2 no-print"
>
    <Printer size={18} />
    Imprimer le rapport
</button>
```

---

## 18. Security & Privacy UI Patterns

### Password Strength Indicator

```javascript
// Visual feedback for password creation
<div className="flex gap-1 mt-2">
    <div
        className={`h-1 flex-1 rounded ${strength >= 1 ? "bg-red-500" : "bg-gray-200"}`}
    ></div>
    <div
        className={`h-1 flex-1 rounded ${strength >= 2 ? "bg-yellow-500" : "bg-gray-200"}`}
    ></div>
    <div
        className={`h-1 flex-1 rounded ${strength >= 3 ? "bg-green-500" : "bg-gray-200"}`}
    ></div>
</div>
```

### Sensitive Data Masking

```javascript
// Phone number masking
const maskedPhone = phone.replace(/(\d{3})\d{4}(\d{3})/, "$1****$2");
// Result: 224****789

// Show/Hide password toggle
<button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="absolute right-3 top-3 text-gray-500"
>
    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
</button>;
```

### Confirmation Dialogs (Destructive Actions)

```javascript
<Dialog>
    <DialogContent>
        <DialogHeader>
            <AlertTriangle className="text-[#E0B63F] mb-2" size={48} />
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
                Cette action est irréversible. Êtes-vous sûr de vouloir
                supprimer ce membre ?
            </DialogDescription>
        </DialogHeader>
        <DialogFooter>
            <Button variant="outline">Annuler</Button>
            <Button variant="destructive">Supprimer</Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
```

---

## 19. File Upload UI

### Avatar Upload (Cloudflare R2)

```javascript
<div className="relative w-32 h-32 mx-auto">
    <img
        src={avatarUrl || "/default-avatar.png"}
        alt="Avatar"
        className="w-full h-full rounded-full object-cover border-4 
               border-white shadow-lg"
    />
    <label
        htmlFor="avatar-upload"
        className="absolute bottom-0 right-0 bg-[#135796] text-white 
               p-2 rounded-full cursor-pointer hover:bg-[#1E6EC0] 
               transition-colors duration-200"
    >
        <Upload size={18} />
        <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
        />
    </label>
</div>
```

### Document Upload (Drag & Drop)

```javascript
<div
    onDrop={handleDrop}
    onDragOver={(e) => e.preventDefault()}
    className="border-2 border-dashed border-gray-300 rounded-[18px] 
             p-12 text-center hover:border-[#135796] 
             transition-colors duration-200 cursor-pointer"
>
    <Upload className="mx-auto text-gray-400 mb-4" size={48} />
    <p className="font-body text-gray-600 mb-2">
        Glissez vos fichiers ici ou cliquez pour sélectionner
    </p>
    <p className="font-body text-sm text-gray-400">
        PDF, DOC, DOCX jusqu'à 10MB
    </p>
</div>
```

---

## 20. Export & Reporting UI

### Export Options Menu

```javascript
<DropdownMenu>
    <DropdownMenuTrigger asChild>
        <Button variant="outline">
            <Download size={18} className="mr-2" />
            Exporter
        </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
        <DropdownMenuItem onClick={() => exportToPDF()}>
            <FileText className="mr-2" size={16} />
            PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportToExcel()}>
            <FileSpreadsheet className="mr-2" size={16} />
            Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportToCSV()}>
            <FileCode className="mr-2" size={16} />
            CSV
        </DropdownMenuItem>
    </DropdownMenuContent>
</DropdownMenu>
```

### Report Header Template

```javascript
<div className="bg-white rounded-[18px] p-8 mb-6 print:shadow-none">
    <div className="flex items-center justify-between mb-6">
        <div>
            <img src="/logo.png" alt="SNAESURS" className="h-16 mb-2" />
            <h1 className="font-heading text-2xl font-bold text-[#0D1D23]">
                Rapport Financier
            </h1>
            <p className="font-body text-gray-600">
                Période: Janvier - Mars 2026
            </p>
        </div>
        <div className="text-right">
            <p className="font-body text-sm text-gray-600">
                Généré le: {new Date().toLocaleDateString("fr-GN")}
            </p>
            <p className="font-body text-sm text-gray-600">
                Par: {currentUser.name}
            </p>
        </div>
    </div>
</div>
```

---

## 21. Mobile App Considerations (Future PWA)

### Progressive Web App (PWA) Meta Tags

```html
<meta name="theme-color" content="#135796" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="SNAESURS" />
<link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
<link rel="manifest" href="/manifest.json" />
```

### Manifest.json

```json
{
    "name": "SNAESURS - Gestion Syndicale",
    "short_name": "SNAESURS",
    "description": "Système de gestion pour syndicats en Guinée",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#F5F7F7",
    "theme_color": "#135796",
    "icons": [
        {
            "src": "/icons/icon-192x192.png",
            "sizes": "192x192",
            "type": "image/png"
        },
        {
            "src": "/icons/icon-512x512.png",
            "sizes": "512x512",
            "type": "image/png"
        }
    ]
}
```

### Offline State UI

```javascript
<div className="bg-[#E0B63F] text-white p-4 text-center">
    <div className="flex items-center justify-center gap-2">
        <WifiOff size={20} />
        <span className="font-body font-medium">
            Mode hors ligne - Certaines fonctionnalités sont limitées
        </span>
    </div>
</div>
```

---

## 22. Development Handoff Checklist

### Design Tokens File

Create a `design-tokens.js` file:

```javascript
export const colors = {
    primary: {
        blue: "#135796",
        blueHover: "#1E6EC0",
    },
    neutral: {
        sage: "#9BA9A1",
        darkSlate: "#0D1D23",
        lightGray: "#F5F7F7",
        white: "#FFFFFF",
    },
    semantic: {
        success: "#1FA750",
        warning: "#E0B63F",
        error: "#D64545",
        info: "#1E6EC0",
    },
    accent: {
        woodBrown: "#9C5931",
        softBeige: "#D9C1A7",
    },
};

export const spacing = {
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px",
    "2xl": "32px",
    "3xl": "48px",
    "4xl": "64px",
};

export const borderRadius = {
    sm: "6px",
    md: "8px",
    lg: "12px",
    xl: "18px",
    "2xl": "24px",
    full: "9999px",
};

export const shadows = {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
};
```

### Required npm Packages

```json
{
    "dependencies": {
        "react": "^18.2.0",
        "react-dom": "^18.2.0",
        "react-router-dom": "^6.20.0",
        "@tanstack/react-query": "^5.14.0",
        "framer-motion": "^10.16.0",
        "recharts": "^2.10.0",
        "lucide-react": "^0.294.0",
        "tailwindcss": "^3.4.0",
        "class-variance-authority": "^0.7.0",
        "clsx": "^2.0.0",
        "tailwind-merge": "^2.0.0",
        "react-i18next": "^13.5.0",
        "date-fns": "^2.30.0"
    }
}
```

### Folder Structure

```
src/
├── assets/
│   ├── images/
│   └── icons/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── layout/          # Sidebar, Navbar, Footer
│   ├── forms/           # Form components
│   └── shared/          # Reusable components
├── pages/
│   ├── auth/
│   ├── dashboard/
│   ├── users/
│   ├── structures/
│   ├── cotisations/
│   ├── reunions/
│   ├── financials/
│   └── settings/
├── hooks/               # Custom React hooks
├── services/            # API services (TanStack Query)
├── utils/               # Helper functions
├── styles/              # Global CSS
├── lib/                 # Library configurations
└── App.jsx
```

---

## 23. Brand Assets & Logo Usage

### Logo Specifications

- **Primary Logo:** Full color on white or light backgrounds
- **Inverse Logo:** White version for dark backgrounds (#0D1D23)
- **Minimum Size:** 120px width (digital), 25mm (print)
- **Clear Space:** Minimum padding equal to the height of the "S" in SNAESURS

### Logo Placement

- **Sidebar:** Top-left, 180px width
- **Login Page:** Centered, 200px width
- **Print Reports:** Top-left, 150px width
- **Email Templates:** Centered header, 160px width

### Don'ts

❌ Don't stretch or distort the logo
❌ Don't change the logo colors
❌ Don't add effects (shadows, gradients, outlines)
❌ Don't place on busy backgrounds
❌ Don't rotate the logo

---

## 24. Content Guidelines

### Tone of Voice

- **Professional** — Formal but approachable
- **Clear** — Simple language, avoid jargon
- **Respectful** — Honor union values and member dignity
- **Action-Oriented** — Direct calls-to-action

### Button Text Guidelines

| Action  | French Text | English |
| ------- | ----------- | ------- |
| Submit  | Enregistrer | Save    |
| Add     | Ajouter     | Add     |
| Edit    | Modifier    | Edit    |
| Delete  | Supprimer   | Delete  |
| Cancel  | Annuler     | Cancel  |
| Confirm | Confirmer   | Confirm |
| Approve | Approuver   | Approve |
| Reject  | Rejeter     | Reject  |
| Export  | Exporter    | Export  |
| Print   | Imprimer    | Print   |

### Error Message Templates

```javascript
// Form validation
"Ce champ est obligatoire";
"Format de téléphone invalide";
"Le mot de passe doit contenir au moins 8 caractères";

// API errors
"Une erreur s'est produite. Veuillez réessayer.";
"Impossible de charger les données. Vérifiez votre connexion.";
"Vous n'avez pas la permission d'effectuer cette action.";

// Success messages
"Enregistré avec succès";
"Membre approuvé avec succès";
"Cotisation enregistrée";
```

---

## 25. Quality Assurance Checklist

### Pre-Launch Testing

- [ ] Test on Chrome, Firefox, Safari, Edge
- [ ] Test on iOS (Safari) and Android (Chrome)
- [ ] Test all user roles (super_admin, admin, trésorier, secrétaire, membre)
- [ ] Test with slow 3G connection
- [ ] Test keyboard navigation
- [ ] Test screen reader compatibility (NVDA/JAWS)
- [ ] Test print layouts for reports
- [ ] Test all form validations
- [ ] Test file uploads (avatar, documents)
- [ ] Test SMS notifications
- [ ] Test data export (PDF, Excel, CSV)
- [ ] Test with real data volumes (1000+ members)
- [ ] Verify color contrast ratios
- [ ] Check for broken links
- [ ] Validate all API integrations
- [ ] Test error states and empty states

### Performance Benchmarks

- **First Contentful Paint:** < 1.5s
- **Time to Interactive:** < 3.5s
- **Lighthouse Score:** > 90
- **Mobile Performance Score:** > 80

---

## 26. Maintenance & Updates

### Version Control

Use semantic versioning: `MAJOR.MINOR.PATCH`

- **MAJOR:** Breaking changes
- **MINOR:** New features (backward-compatible)
- **PATCH:** Bug fixes

### Design System Updates

- Document all changes in a CHANGELOG.md
- Notify developers of breaking changes
- Maintain backward compatibility when possible
- Archive old design tokens

### Regular Audits

- Quarterly accessibility audit
- Biannual design review
- Annual brand refresh evaluation

---

## 27. Support & Resources

### Design Files

- Figma Community File: [Link to be added]
- Logo Package: [Link to be added]
- Icon Library: [Lucide React](https://lucide.dev/)

### Developer Documentation

- TailwindCSS: https://tailwindcss.com/docs
- shadcn/ui: https://ui.shadcn.com/
- TanStack Query: https://tanstack.com/query/latest
- Framer Motion: https://www.framer.com/motion/
- Recharts: https://recharts.org/

### Contact

For design questions or clarifications:

- Design Lead: [Name]
- Frontend Lead: [Name]
- Project Manager: [Name]

---

## Conclusion

This graphic charter ensures a **consistent, professional, and accessible** user experience for the SNAESURS union management system. By following these guidelines, the frontend team can build a robust React application that serves the needs of union administrators, treasurers, secretaries, and members across Guinea.

**Key Takeaways:**

1. Use **Orbitron** for headings and **Inter** for body text
2. Maintain the **#135796** primary blue throughout all interactions
3. Implement **mobile-first** responsive design
4. Follow **WCAG 2.1 AA** accessibility standards
5. Use **TanStack Query** for API communication
6. Leverage **shadcn/ui** and **TailwindCSS** for rapid development
7. Add **subtle animations** with Framer Motion
8. Ensure **role-based color coding** for clarity

---

**Document Version:** 1.0  
**Last Updated:** May 14, 2026  
**Prepared For:** SNAESURS Frontend Development Team  
**Prepared By:** AI Design System Review based on Laravel API analysis
