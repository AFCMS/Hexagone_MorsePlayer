---
applyTo: "**/*.ts,**/*.tsx"
description: Instructions for React Native
---

## React and JSX/TSX Guidelines

- Use functional components with hooks.
- You MUST use interfaces for defining component props.
- When possible, prefer `readonly` properties in props interfaces.
- You MUST never destructure props in the function signature.

```tsx
interface MyComponentProps {
  readonly title: string;
}

function MyComponent(props: MyComponentProps) {
  return <h1>{props.title}</h1>;
}
```
