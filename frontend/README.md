## App structure
src/
 ├─ app/              # providers
 ├─ pages/            # pages
 ├─ features/         # user interactions
 ├─ entities/         # base api/libs + types for entities
 ├─ shared/
 │   ├─ ui/           
 │   ├─ lib/
 │   ├─ hooks/
 │   ├─ config/
 ├─ components/       # shadcn (Do not touch)
 ├─ lib/              # shadcn (Do not touch)

## Dev guide

### Adding a shadcn component (example)
```
bunx --bun shadcn@latest add {component_name}
```
This will add the component to `app/components/ui`.

### Adding a new page
Create a new directory inside `pages` and add a `page.tsx` file. The component should be exported as a named export (not a default export).
