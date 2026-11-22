let n = 0;
/** Collision-safe id (Date.now() alone collides when two items are added in the same ms). */
export function uid(): string {
  n = (n + 1) % 1e6;
  return `${Date.now().toString(36)}-${n.toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
