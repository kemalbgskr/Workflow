# BNI SDLC Approvals - Design Guidelines

## Design Approach: Enterprise Dashboard System

**Selected Approach**: Design System-based (Enterprise Dashboard Pattern)  
**Primary References**: Linear (project clarity), Notion (document organization), Material Design (data density)  
**Rationale**: This is a utility-focused internal tool where efficiency, clarity, and consistent workflows are paramount. Users need to process approvals quickly and track project statuses reliably.

---

## Core Design Principles

1. **Information Clarity**: Dense data presented with clear hierarchy and visual breathing room
2. **Workflow Efficiency**: Minimize clicks; surface critical actions prominently
3. **Status Visibility**: Always-visible project state and approval progress
4. **Brand Integration**: Professional BNI identity without compromising functionality

---

## Color Palette

### Brand Colors (Dark Mode Primary)
- **Primary Teal**: `180 70% 45%` (from BNI logo - buttons, accents, active states)
- **Primary Orange**: `25 85% 55%` (from BNI logo - warnings, highlights, secondary actions)
- **Brand Dark**: `200 15% 12%` (deep navy-teal for backgrounds)

### System Colors (Dark Mode)
- **Background Base**: `220 15% 8%` (dark charcoal)
- **Surface Elevated**: `220 12% 12%` (cards, panels)
- **Surface Hover**: `220 12% 15%` (interactive surfaces)
- **Border Subtle**: `220 15% 18%` (dividers, card borders)
- **Text Primary**: `220 8% 95%` (main content)
- **Text Secondary**: `220 8% 65%` (labels, metadata)
- **Text Muted**: `220 8% 45%` (timestamps, captions)

### Status Colors
- **Success**: `142 70% 45%` (approved, signed, completed)
- **Warning**: `40 90% 55%` (pending review, in progress)
- **Error**: `0 70% 50%` (rejected, declined, failed)
- **Info**: `210 85% 55%` (draft, informational)

---

## Typography

**Font Stack**: Inter (primary), system-ui fallback  
**CDN**: Google Fonts - `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap`

### Scale & Usage
- **Display (Hero)**: 32px/40px, font-weight: 700 (dashboard headers, page titles)
- **Heading 1**: 24px/32px, font-weight: 600 (section headers, dialog titles)
- **Heading 2**: 18px/28px, font-weight: 600 (card titles, subsection headers)
- **Body Large**: 16px/24px, font-weight: 400 (primary content, form labels)
- **Body**: 14px/20px, font-weight: 400 (descriptions, table cells, default text)
- **Caption**: 12px/16px, font-weight: 500 (metadata, timestamps, status badges)

---

## Layout System

### Spacing Primitives (Tailwind Units)
**Primary Set**: `2, 3, 4, 6, 8, 12, 16, 20, 24` (e.g., `p-4`, `gap-6`, `mb-8`)

### Grid & Container Strategy
- **Max Content Width**: `max-w-7xl` (1280px) for main dashboard areas
- **Sidebar Width**: `280px` fixed (navigation, filters)
- **Form Containers**: `max-w-2xl` (672px) for optimal form readability
- **Dashboard Grid**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` (responsive cards)

### Component Spacing
- **Page Padding**: `p-6 lg:p-8` (consistent page margins)
- **Card Internal**: `p-6` (consistent card padding)
- **Section Gaps**: `space-y-8` (vertical rhythm between major sections)
- **Form Field Gaps**: `space-y-4` (form element spacing)
- **Inline Elements**: `gap-2` or `gap-3` (button groups, chips, inline metadata)

---

## Component Library

### Navigation & Layout
- **Top Header**: Fixed, full-width, `h-16`, BNI logo left, user menu right, subtle `border-b`
- **Sidebar**: Fixed left, `w-280px`, scrollable, grouped nav items with icons (Heroicons)
- **Dashboard Cards**: Rounded `rounded-lg`, elevated shadow `shadow-md`, hover lift `hover:shadow-lg transition-shadow`
- **Breadcrumbs**: Small text, chevron separators, teal active state

### Data Display
- **Status Chips**: Rounded-full, small padding `px-3 py-1`, text-xs, color-coded backgrounds with white/dark text
- **Timeline Stepper**: Horizontal for desktop (vertical mobile), connected lines, circle nodes, active state in teal, completed in green, pending in gray
- **Tables**: Striped rows optional, hover highlight, sticky headers, sort indicators, compact row height `h-12`
- **Document Cards**: Preview thumbnail (if PDF), title, metadata row (date, version, status), action dropdown right-aligned

### Forms & Inputs
- **Form Fields**: Label above input, `text-sm font-medium`, subtle border `border-gray-700`, focus ring in teal
- **Buttons Primary**: Teal background, white text, `h-10 px-4`, rounded-md, hover darken
- **Buttons Secondary**: Transparent with teal border, teal text, same dimensions
- **Buttons Danger**: Orange background for delete/reject actions
- **File Upload**: Dashed border dropzone, drag-active state, file list below with remove icons
- **Select Dropdowns**: shadcn/ui style, keyboard navigable, search if >8 options

### Overlays & Feedback
- **Modals/Dialogs**: Centered, `max-w-2xl`, dark backdrop blur, slide-up animation, header with close X
- **Drawers**: Slide from right, `w-96`, for filters or secondary forms
- **Toasts**: Top-right corner, auto-dismiss, color-coded by type (success/error/info)
- **Loading States**: Skeleton loaders for tables/cards, spinner for buttons, subtle pulse animation

### Workflow-Specific Components
- **Approval Flow Builder**: Drag-drop list (react-beautiful-dnd pattern), approver cards with avatar, role badge, order number, sequential/parallel toggle prominent
- **PDF Viewer**: Two-column layout - metadata/approvers left `w-80`, PDF embed right with zoom controls
- **Comment Thread**: Nested indentation, avatar + name + timestamp header, markdown-supported body
- **Audit Log**: Table format, icon column for action type, expandable JSON metadata

---

## Interaction Patterns

### Animations (Minimal & Purposeful)
- **Page Transitions**: None (instant navigation for enterprise speed)
- **Micro-interactions**: 
  - Button hover scale `hover:scale-105` only for primary CTAs
  - Card hover lift via shadow (already specified)
  - Status chip pulse on update `animate-pulse` for 2s
- **Loading**: Subtle skeleton shimmer, no elaborate spinners

### State Management
- **Focus States**: Teal ring `ring-2 ring-teal-500` on all interactive elements
- **Disabled States**: `opacity-50 cursor-not-allowed`, grayscale filter optional
- **Active/Selected**: Background teal with white text for navigation, border-left-4 for sidebar active item

---

## Page-Specific Layouts

### Login Page
- **Structure**: Centered card `max-w-md`, BNI logo top, heading + subheading, form, remember me + forgot password row
- **Background**: Subtle gradient from brand-dark to background-base, abstract geometric pattern overlay (CSS only)

### Dashboard
- **Top Stats Row**: 4 metric cards (grid-cols-4), icon left, number large, label below, teal accent bar top
- **Main Sections**: "My Approvals" table card, "Recent Projects" grid, "Waiting for Signature" list
- **Quick Actions**: Floating "New Initiative" button bottom-right `fixed bottom-8 right-8`, orange background, large with icon

### Project Detail
- **Header Bar**: Full-width, project title left (H1), status chip, owner avatar/name, action menu right
- **Stepper Timeline**: Below header, horizontal scroll on mobile, current step highlighted teal, lines connecting nodes
- **Tabs**: Sticky below stepper, underline active state in teal, icons optional (Documents, Approvals, Comments, History)
- **Tab Content**: Padded container, each tab uses appropriate component (table for docs, builder for approvals, thread for comments)

### Document Viewer
- **Split Layout**: Sidebar `w-80` fixed (scrollable metadata + approvers list), main area PDF embed with toolbar
- **Approver List**: Stacked cards, avatar + name + role, status icon right, sequential numbers if applicable, completed items subtle green tint

### Admin Panel
- **Sidebar Tabs**: Vertical tab list left `w-48` (Users, Groups, Templates, Settings)
- **Content Area**: Tables with search, filter dropdowns top, bulk actions toolbar when rows selected, inline edit where possible

---

## Accessibility & Dark Mode

- **Contrast**: All text meets WCAA AA (4.5:1 ratio minimum)
- **Dark Mode**: Default and only mode (consistent with system preferences if needed)
- **Form Inputs**: Dark backgrounds `bg-gray-900`, light borders, white text, proper labels with `htmlFor`
- **Icons**: Heroicons exclusively, always with accessible labels/tooltips
- **Keyboard Navigation**: Visible focus indicators, logical tab order, escape to close modals

---

## Images & Assets

**No Hero Images**: This is an internal dashboard, not a marketing site. Visual assets include:

### Required Images
- **BNI Logo**: `/public/bni-logo.png` - displayed in header (top-left, `h-8`), login page (centered, `h-12`)
- **User Avatars**: Initials-based fallback circles (first+last name), teal background, white text if no photo
- **Document Thumbnails**: PDF first-page preview (generated server-side or placeholder PDF icon)
- **Empty States**: Simple illustration placeholders (undraw.co style) for "No documents yet", "No approvals pending" - muted colors, small size `w-48`

### Icons
**Library**: Heroicons (outline for navigation, solid for emphasis)  
**CDN**: `https://cdn.jsdelivr.net/npm/heroicons@2.0.18/outline/index.js`  
**Common Icons**: DocumentIcon, CheckCircleIcon, ClockIcon, UserGroupIcon, ChartBarIcon, CogIcon, PencilIcon, TrashIcon

---

## Quality Standards

- **Production-Ready Polish**: Every interaction feels intentional, no placeholder text in demo
- **Data Density Balance**: Tables show essential columns only, expandable rows for details, pagination at 20 rows
- **Responsive Breakpoints**: Mobile stack to single column, tablet 2-column grids, desktop full layouts
- **Performance**: Lazy load PDF previews, virtualized long lists (react-window), optimistic UI updates
- **Error Handling**: Inline validation messages, retry buttons on failed actions, clear error states with icons

This design creates a professional, efficient enterprise dashboard that respects BNI branding while prioritizing user productivity and data clarity.