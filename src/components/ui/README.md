# Quadra UI Primitives

Generic, reusable components that consume Quadra DS tokens. All values come from `src/design-system/theme.css` CSS variables — no hardcoded colors or sizes.

## Usage

```tsx
import { Button, Card, Field, Badge } from '@/components/ui'
```

---

## Components

### Button

```tsx
<Button variant="primary" size="md">Save</Button>
<Button variant="secondary" loading>Saving…</Button>
<Button variant="ghost" size="sm">Cancel</Button>
<Button variant="danger" fullWidth>Delete</Button>
<Button variant="primary" size="icon" aria-label="Add">+</Button>
```

Props: `variant` (primary | secondary | ghost | danger), `size` (sm | md | lg | icon), `loading`, `fullWidth`, + all `<button>` HTML attrs.

---

### Card

```tsx
<Card variant="elevated">
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
  <Card.Footer>Footer</Card.Footer>
</Card>
```

Props: `variant` (default | elevated | inverse). Sub-components: `Card.Header`, `Card.Body`, `Card.Footer`.

---

### Input

```tsx
<Input placeholder="Search…" fullWidth />
<Input error placeholder="nome@empresa.com" />
```

Props: `error`, `fullWidth`, + all `<input>` HTML attrs.

Placeholder policy: labels remain mandatory, and placeholders never replace the label. Use placeholders only for format guidance or concrete examples such as search, email format, phone format, document masks, or URLs. Password fields default to no placeholder. When a specific screen intentionally benefits from a password example, use the standard placeholder `••••••••`.

Intentional password exception for screens that benefit from it:

```tsx
<Input type="password" placeholder="••••••••" />
```

---

### Field

Composes `Input` with a label, hint, and error message.

```tsx
<Field label="Email" hint="We'll never share your email." inputProps={{ type: 'email', placeholder: 'nome@empresa.com' }} />

// Custom input override via children:
<Field label="Organisation">
  <Select … />
</Field>
```

Intentional password exception for screens that benefit from it:

```tsx
<Field label="Senha" error="Too short" required inputProps={{ type: 'password', placeholder: '••••••••' }} />
```

Props: `label`, `hint`, `error`, `required`, `inputProps`, `children`, `id`.

---

### Badge

```tsx
<Badge variant="live" dot>Live</Badge>
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="ghost">Draft</Badge>
```

Variants: default | accent | live | success | warning | danger | ghost. Optional `dot` indicator.

---

### Tabs

Controlled component — no internal routing.

```tsx
const [tab, setTab] = useState('overview')

<Tabs
  variant="line"
  tabs={[
    { id: 'overview', label: 'Overview' },
    { id: 'stats', label: 'Stats' },
    { id: 'roster', label: 'Roster', disabled: true },
  ]}
  activeTab={tab}
  onChange={setTab}
/>
```

Variants: `line` (default) | `pill`.

---

### Avatar

```tsx
<Avatar initials="JD" size="md" />
<Avatar initials="AB" src="/avatars/alice.jpg" size="lg" alt="Alice B." />
```

Props: `initials` (required), `src`, `size` (sm | md | lg), `alt`.

---

### Table

```tsx
<Table>
  <TableHead>
    <TableRow>
      <TableHeaderCell>Name</TableHeaderCell>
      <TableHeaderCell>Status</TableHeaderCell>
    </TableRow>
  </TableHead>
  <TableBody>
    <TableRow selected>
      <TableCell>Alice</TableCell>
      <TableCell><Badge variant="success">Active</Badge></TableCell>
    </TableRow>
  </TableBody>
</Table>
```

`TableRow` accepts `selected?: boolean` for highlighted rows.

---

### StatCard

```tsx
<StatCard label="Total athletes" value={142} delta="+12 this month" trend="up" />
<StatCard label="Win rate" value="68%" delta="-3%" trend="down" />
```

Props: `label`, `value` (ReactNode), `delta`, `trend` (up | down | neutral).

---

### EmptyState

```tsx
<EmptyState
  title="No athletes yet"
  description="Add your first athlete to get started."
  action={<Button size="sm">Add athlete</Button>}
/>
```

Optional `icon` prop accepts any ReactNode to replace the default `○` placeholder.

---

### LoadingState

```tsx
<LoadingState message="Loading athletes…" />
```

Renders a spinner using `--accent`. Respects `prefers-reduced-motion`.

---

### ErrorState

```tsx
<ErrorState
  title="Something went wrong"
  description="We couldn't load the data. Try again."
  onRetry={() => refetch()}
/>
```

Props: `title`, `description`, `onRetry`, `retryLabel` (default: "Tentar novamente").
