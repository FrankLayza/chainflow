<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:code-style-rules -->
# Code Style Rules

## Comments
Write minimal comments. Only comment on non-obvious intent or a deliberate trade-off. Do not add section headers, decorative dividers, or restate what the code already says. No `//---` banners, no `/* ====== */` blocks, no `// Render` / `// Helper` labels.

## Tailwind CSS
Always use Tailwind's named utility classes. Never write arbitrary values like `tracking-[0.1em]`, `text-[11px]`, or `w-[14px]` when a built-in scale value exists. Prefer `tracking-wider`, `text-xs`, `w-3.5`, etc. Only reach for bracket notation when the design token genuinely has no semantic equivalent in the Tailwind scale.
<!-- END:code-style-rules -->
