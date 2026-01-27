---
applyTo: "**/*.ts,**/*.tsx"
description: Instructions for TypeScript files
---

# Imports

Imports must be ordered as follows:

1. Group `react*` packages first (by order of importance), then `expo` modules alphabetically.
2. Then other packages alphabetically.
3. Relative imports from the current package

Each of these groups must be separated by a single blank line.

# Interfaces, Types and objects

When defining interfaces, always use the `readonly` modifier when possible.

When defining objects that should typically not be modified in their lifetime, use `as const` to ensure immutability.
