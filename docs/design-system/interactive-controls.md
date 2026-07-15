# Interactive controls and native appearance

> **Source of truth:** this is Quadra's normative guideline for the appearance, accessibility, and architecture of user-visible interactive controls. `DESIGN.md`, `AGENTS.md`, and `CLAUDE.md` only reference it and must not duplicate it.

## Purpose and scope

A native browser control **must not** retain a generic appearance by accident when it conflicts with the Quadra design system. When it is part of the visible product interface, prefer a reusable Quadra DS component or an accessible custom visual layer. Native semantics and behavior should be preserved when useful; only the appearance must not go unaddressed because a component is missing.

This rule covers form controls, browser-provided affordances, and scrollable areas: scrollbars, numeric fields, `select`, comboboxes, search, date and time, checkboxes, radios, switches, sliders, uploads, and equivalent controls introduced in the future. It does not authorize replacing HTML elements indiscriminately with custom `div`s.

There are two distinct categories:

- **Data and search UX:** pagination, `search`, repeated `ids`, cumulative filters, selected-item loading, and the choice between a simple `select` and `SearchSelect`. The contract is defined in the [sports spec, section 8.12](../../../docs/superpowers/specs/2026-07-06-sports-db-structure-design.md#812-contrato-de-listagem--pagina%C3%A7%C3%A3o-e-filtros-opcionais-pendente-decidido-em-2026-07-14).
- **Visual consistency of controls:** appearance, states, accessibility, responsiveness, and reuse. This guideline is the source of truth for this category and applies to every module, not only sports.

`color-scheme` is declared in `theme.css` (`light` on `:root`, `dark` on `html[data-theme="dark"]`). It tells the browser which scheme to paint the widgets it still draws itself: the document scrollbar, autofill fill, search field cancel button, and textarea resize grip.

## Global rules

1. Before creating or styling a control, **must** look for an equivalent in `src/components/ui/` and tokens in `src/design-system/theme.css`.
2. When no suitable component exists, **must** create or extend a reusable Quadra DS primitive; do not repeat behavior and CSS across screens or CSS Modules.
3. Every visual customization **must** use `theme.css` tokens. Do not introduce arbitrary per-screen colors, radii, shadows, spacing, icons, or dimensions.
4. Applicable controls **must** work in light theme, `html[data-theme="dark"]`, and compact density (`html[data-density="compact"]`).
5. A custom appearance **must not** remove, without an equivalent alternative: semantics, labels, visible focus, keyboard navigation, error feedback, interaction affordance, mobile behavior, or assistive-technology support.
6. Hover, `focus-visible`, selected/active, error, `disabled`, `read-only`, loading, and empty states **must** be defined whenever they apply to a control. Transitions and animated indicators must respect `prefers-reduced-motion`.
7. A decision to retain native appearance must be conscious and justified by usability, accessibility, platform behavior, or a real browser/operating-system limitation — never by the absence of an implementation.
8. Do not add an external library only to change the appearance of a simple control without evaluating existing primitives, dependencies, and internal patterns. If an adopted UI library provides a control, it must be wrapped by Quadra DS and consume project tokens.

The current patterns in `OrgSelectionPage` (thin scrollbar with Firefox/WebKit fallback) and `RegisterPage` (height control with explicit buttons and `aria-label`) are references, not code to copy. They demonstrate token usage, visible focus, and semantics rather than an API or CSS to reproduce in every screen.

## Scrollbars and scrollable surfaces

Pages, modals, drawers, dropdowns, searchable selects, tables, menus, side panels, and internal containers with visible overflow **must** use the Quadra scrollbar pattern where browser support permits it.

- Scrollbars must be discreet but perceptible when scrolling is necessary; they must not be hidden by default for content users need to discover or navigate.
- Thumb, track, hover, and active states must use surface and border tokens. Implement `scrollbar-width`/`scrollbar-color` for Firefox and `::-webkit-scrollbar*` pseudo-elements for WebKit/Blink, with an acceptable native fallback where support is unavailable.
- Customization must not interfere with touch, trackpad, wheel, Page Up/Down, Home/End, or keyboard scrolling. Do not reduce the usable area or contrast enough to make mouse use impractical.
- Only deliberate exceptions, such as decorative navigation without additional content, may hide a scrollbar. The exception must keep scrolling accessible and be documented with the component.

## Numeric fields and steppers

Native spin buttons on `input[type="number"]` **must not** remain visible when they conflict with Quadra DS. When incrementing and decrementing are part of the task, prefer a reusable numeric primitive with integrated buttons and project icons.

- It must honor `min`, `max`, and `step`, disable actions at bounds, and prevent invalid values without blocking valid manual input.
- It must support the keyboard, including manual entry and arrow keys where appropriate; buttons must have accessible names, reachable focus, and adequate touch/click targets.
- It must expose hover, focus, error, `disabled`, and `read-only` states, including in tables, forms, and statistics interfaces.
- When buttons are not useful, native spin buttons may be visually removed, but the field must retain its semantics and manual entry. Do not use a text field to work around a visual concern without consciously handling validation, `inputMode`, and accessibility.

`NumberField` (`src/components/ui/NumberField`) hides native spin buttons and offers stacked arrows instead. The dense `dense` variant is for box scores. Values clamp on blur, never while typing; its arrows are outside the tab order because arrow keys on the field already step the value.

## Selection, comboboxes, and search

The following names have different purposes and must not be used interchangeably:

| Control | Allowed use |
| --- | --- |
| Native `<select>` | A small, closed, predictable collection without search or complex multi-selection. |
| Visually custom select | The same simple selection as a native `select`, when native appearance conflicts and the implementation preserves semantics and operation. |
| Combobox/autocomplete | Single or multiple selection from a dynamic collection, with text entry and filtered options. |
| `SearchSelect` | Quadra's searchable-selection primitive for paginated or remote data; it must honor the section 8.12 data contract. |
| Multiselect | Selecting several items, with the current selection always understandable and removable by keyboard and screen reader. |

For large, paginated, dynamic, API-loaded, searchable, multi-select, or selected-value-preserving collections, **must** use `SearchSelect`, a combobox, or another suitable reusable primitive — not a `<select>` populated with the entire collection.

`Combobox` (`src/components/ui/Combobox`) replaces every native `<select>` in the product. Search appears automatically past eight options. Because its listbox is custom, every change must preserve its keyboard, focus-return, and `aria-selected` tests. `SearchSelect` (`src/components/ui/SearchSelect`) is its remote sibling, with debounce, loading, and error states; it shares the same popover.

These primitives must include loading, empty, no-results, error, `disabled`, `read-only`, focus, active-item, selection, and incremental-loading/pagination states where applicable. Selected items must remain visible when search or page changes; retrieval by `ids` follows section 8.12. The pattern must provide keyboard navigation, managed focus, correct ARIA roles/attributes, and readable screen-reader feedback.

Search fields must integrate the search icon, empty value, loading, no-results, and error states into the design system. The native cancel button for `input[type="search"]` may be hidden or replaced only when there is an equivalent, clearly labelled, keyboard-operable button. Debounce is appropriate for remote search, but must not delay clearing, cancellation, or state announcements in a misleading way.

## Date, time, and calendars

`input[type="date"]`, `time`, and `datetime-local` can vary significantly between browsers and operating systems. The visible field surface — typography, border, icon, focus, error, and value — must follow Quadra DS.

On desktop, a reusable picker or calendar can be preferable when the project supports it adequately. On mobile, the native picker may be retained when it offers a better platform experience. The component must document this adaptive difference. Do not replace a native picker with a custom control that is less accessible, less localized, or less functional. The displayed format and the technical value sent by the application must be treated separately; locale and timezone follow established product standards.

`DateTimeField` (`src/components/ui/DateTimeField`) opens a Quadra calendar on a fine pointer and falls back to native `datetime-local` on a coarse pointer. The emitted value is identical either way.

## Checkboxes, radios, switches, and range

User-visible checkboxes, radios, and switches must follow a centralized primitive with checked, unchecked, indeterminate (when applicable), hover, `focus-visible`, error, `disabled`, and dark-theme states. Every control must have an associated label, adequate click area, keyboard operation, and correct screen-reader announcement.

Sliders based on `input[type="range"]` must customize track and thumb with Quadra tokens without losing minimum, maximum, `step`, current value, visible focus, contrast, or an adequate touch target. A separate visual control must remain synchronized with a semantically equivalent input.

## Uploads and other native affordances

`input[type="file"]` must not rely only on native browser appearance when it is shown directly in the interface. Prefer a DS button or selection area while keeping the native input internally associated with its label and keyboard-operable. Drag and drop is complementary, never the only path. The primitive must provide selected files, invalid type/size, limit, error, and upload feedback whenever those states are part of the flow.

When introducing `progress`, `meter`, `details`/`summary`, `datalist`, color pickers, autofill/autocomplete, disclosure indicators, password reveal, pagination, or another native affordance, evaluate whether its appearance and states conflict with the product. Standardize only controls with a real product use; do not create artificial rules. When the browser or operating system does not permit reliable styling, preserve native behavior and provide a functional, readable, accessible fallback.

## Review checklist

Before approving a new or changed interactive control, confirm:

- an existing primitive was researched and reused, or the new primitive has a reusable responsibility;
- `src/design-system/theme.css` tokens were used and applicable themes/density were considered;
- mouse, keyboard, touch, screen reader, labels, visible focus, and errors remain functional;
- there is an acceptable fallback for browser limitations and mobile;
- visual CSS is not duplicated across pages;
- searchable selection honors the section 8.12 data contract.
