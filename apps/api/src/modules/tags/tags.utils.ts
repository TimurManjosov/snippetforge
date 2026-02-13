// src/modules/tags/tags.utils.ts

/**
 * Tags Utilities - Helper functions für Tag-Operationen
 */

/**
 * Konvertiert Tag-Namen zu URL-freundlichem Slug
 *
 * REGELN:
 * - Lowercase
 * - Leerzeichen → Bindestriche
 * - Nicht-alphanumerische Zeichen entfernen (außer Bindestriche)
 * - Multiple Bindestriche → Single
 * - Trim Bindestriche an Start/Ende
 *
 * @param name - Tag-Name (z.B. "TypeScript React")
 * @returns Slug (z.B. "typescript-react")
 *
 * @example
 * slugify("TypeScript") → "typescript"
 * slugify("React Hooks") → "react-hooks"
 * slugify("C++") → "c"
 * slugify("Node.js") → "nodejs"
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Spaces to hyphens
    .replace(/[^a-z0-9-]/g, '') // Remove non-alphanumeric (except hyphens)
    .replace(/-+/g, '-') // Multiple hyphens to single
    .replace(/^-+|-+$/g, ''); // Trim hyphens
}
