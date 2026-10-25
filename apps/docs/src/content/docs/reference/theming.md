---

title: Theming
description: Customize diagram colors and surfaces with CSS variables.
---

Pele diagrams use CSS variables, so colors can respond to the surrounding theme without rendering the SVG again.

| Variable             | Controls                    |
| -------------------- | --------------------------- |
| `--pele-bg`          | Diagram background          |
| `--pele-fg`          | Primary text and foreground |
| `--pele-muted`       | Secondary text              |
| `--pele-line`        | Connectors and lines        |
| `--pele-surface`     | Node surfaces               |
| `--pele-surface-alt` | Alternate surfaces          |
| `--pele-border`      | Borders and outlines        |
| `--pele-accent`      | Accent elements             |

## Astro and Starlight

`astro-pele/theme.css` provides neutral light and dark palettes using `prefers-color-scheme`.

The Starlight plugin maps Pele variables to Starlight variables: `--pele-bg` to `--sl-color-bg`, `--pele-fg` to `--sl-color-text`, `--pele-muted` to `--sl-color-gray-3`, `--pele-line` to `--sl-color-gray-5`, `--pele-surface` to `--sl-color-bg-sidebar`, `--pele-surface-alt` to `--sl-color-bg-inline-code`, `--pele-border` to `--sl-color-hairline`, and `--pele-accent` to `--sl-color-accent`.

Those Starlight variables change with the selected light or dark theme, so diagrams follow automatically.

## Custom theme

Override variables on the diagram wrapper or one of its ancestors. For example:

```css
.pele-diagram {
	--pele-bg: #fffdf5;
	--pele-fg: #292524;
	--pele-line: #78716c;
	--pele-surface: #f5f5f4;
	--pele-surface-alt: #e7e5e4;
	--pele-border: #d6d3d1;
	--pele-accent: #b45309;
}

:root[data-theme="dark"] .pele-diagram {
	--pele-bg: #1c1917;
	--pele-fg: #fafaf9;
	--pele-line: #a8a29e;
	--pele-surface: #292524;
	--pele-surface-alt: #44403c;
	--pele-border: #57534e;
	--pele-accent: #fbbf24;
}
```

Keep these overrides after the integration theme in your CSS cascade.
