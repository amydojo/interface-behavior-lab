# Tokens

These JSON files translate the Figma foundations into portable, implementation-neutral values.

- `color-primitives.json` contains raw color values
- `semantic-colors.json` maps roles across Light, Dark, and Spatial modes
- `metrics.json` contains spacing, radii, sizing, stroke, and opacity
- `behavior.json` contains motion, pressure, resistance, and magnetism values

Names use slash-delimited Figma-style paths. Production code may transform them into CSS custom properties, Swift names, Android resources, or another platform convention.
