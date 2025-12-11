# PaaS UI/UX Design Guidelines - "Virtual SysAdmin"

> **Design Philosophy**: The interface should act as an intelligent, invisible layer between the user and the complex infrastructure. It must be **empowering** for beginners (hiding complexity) yet **transparent** for advanced users (showing logs/metrics on demand).

---

## 1. Visual Style: "Deep Space Glass"

A modern, developer-centric aesthetic combining deep dark backgrounds with glassmorphism elements to create depth and hierarchy.

### Core Principles
1.  **Immersive Dark Mode**: Default to dark mode to reduce eye strain during long coding sessions.
2.  **Glassmorphism**: Use translucent surfaces with background blur to visualize "layers" of infrastructure (e.g., a Service floating above the Cluster).
3.  **Visual Status**: Use color and motion to instantly communicate system health (e.g., a pulsing green dot for "Running").
4.  **Content-First**: Minimize chrome/borders. Data and content should be the focus.

---

## 2. Color Palette (Tailwind CSS Compatible)

### Base Surfaces
| Token | Hex | Tailwind Utility | Usage |
|-------|-----|------------------|-------|
| **Background** | `#0F172A` | `bg-slate-900` | Main app background (Deep Space) |
| **Surface** | `#1E293B` | `bg-slate-800` | Sidebar, Panels (Opaque fallback) |
| **Glass** | `rgba(30, 41, 59, 0.7)` | `bg-slate-800/70 backdrop-blur-md` | Cards, Modals, Floating headers |
| **Border** | `#334155` | `border-slate-700` | Subtle dividers |

### Brand & Accents
| Token | Hex | Tailwind Utility | Usage |
|-------|-----|------------------|-------|
| **Primary** | `#6366F1` | `text-indigo-500` | CTAs, Active States, Key Highlights |
| **Primary Glow**| `#4F46E5` | `shadow-indigo-500/50` | Button glow, Focus rings |
| **Secondary** | `#06B6D4` | `text-cyan-500` | Information, Secondary actions |

### Semantic Status
| Status | Color | Hex | Usage |
|--------|-------|-----|-------|
| **Success** | Emerald | `#10B981` | Running, Deployed, Healthy |
| **Warning** | Amber | `#F59E0B` | Building, Provisioning, High Usage |
| **Error** | Rose | `#F43F5E` | Crashed, Failed, Offline |
| **Neutral** | Slate | `#94A3B8` | Stopped, Paused, Unknown |

### Typography Colors
| Token | Hex | Usage |
|-------|-----|-------|
| **Text-Primary** | `#F8FAFC` (Slate-50) | Headings, Main values |
| **Text-Secondary** | `#94A3B8` (Slate-400) | Labels, Descriptions, Metadata |
| **Text-Muted** | `#475569` (Slate-600) | Placeholders, Disabled text |

---

## 3. Typography System

**Font Family**: `Inter` (UI) + `JetBrains Mono` (Code/Logs)

| Role | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| **Display** | 24px/30px | Bold (700) | 1.2 | Page Titles, Dashboard Greetings |
| **Heading** | 18px | Semibold (600)| 1.4 | Section Headers, Card Titles |
| **Body** | 14px | Regular (400) | 1.5 | General Content |
| **Small** | 12px | Medium (500) | 1.5 | Badges, Meta info |
| **Code** | 13px | Regular (400) | 1.6 | Logs, Terminal, Env Vars |

---

## 4. Component Library Spec

### A. The "Magic" Service Card
A centralized view for a single application service.
*   **Container**: `bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-indigo-500/50 transition-colors`
*   **Header**: Service Name (Bold) + Live Status Dot (Pulse animation).
*   **Metrics Row**: Mini sparklines for CPU/RAM usage.
*   **Quick Actions**:
    *   `Logs`: Icon only, opens slide-over panel.
    *   `Terminal`: Icon only, opens bottom sheet.
    *   `Visit`: External link icon to the live URL.

### B. The "Command Center" Dashboard
*   **Greeting**: "Good afternoon, [User]. All systems nominal."
*   **Grid Layout**: Masonry or defined grid (CSS Grid).
*   **Widgets**:
    *   **Resource Quota**: Circular progress bars (Donut charts) showing CPU/RAM usage vs Tier limit.
    *   **Deployments**: Timeline view of recent Git pushes and build statuses.

### C. The "Hacker" Terminal
*   **Background**: `#020617` (Slate-950) - darker than main bg.
*   **Font**: JetBrains Mono, `#10B981` (Green) or `#E2E8F0` (Slate-200) text.
*   **Cursor**: Block blinking cursor.
*   **Scrollbar**: Thin, minimalist.

### D. Navigation Sidebar
*   **State**: Collapsible (Icons only -> Full width).
*   **Style**: Glassmorphism sticky sidebar.
*   **Active Item**: Left border highlight (`border-l-4 border-indigo-500`) + layered background (`bg-indigo-500/10`).

---

## 5. UX Behaviors & Micro-interactions

1.  **Loading States**: Never show a blank screen. Use skeleton loaders that mimic the "glass" shape of the content.
    *   *Deploying*: Show a progress bar with a "building" animation (striped moving gradient).
2.  **Feedback**:
    *   *Success*: Toast notification bottom-right (Green glow).
    *   *Error*: Toast notification bottom-right (Red glow) + Shake animation on the form.
3.  **Hover Effects**:
    *   Cards should lift slightly (`transpose-y-1`) and glow (`shadow-lg shadow-indigo-500/20`) on hover.
4.  **Transitions**: Use `duration-200 ease-in-out` for all state changes.

---

## 6. Implementation Notes (Tailwind)

Add this to `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        background: '#0F172A', // slate-900
        surface: '#1E293B',    // slate-800
        primary: '#6366F1',    // indigo-500
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    }
  }
}
```
