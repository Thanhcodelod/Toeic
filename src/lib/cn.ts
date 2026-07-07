/**
 * Tiny className joiner. Filters out falsy values so you can write:
 *   cn('base', isActive && 'active', disabled ? 'opacity-50' : undefined)
 */
export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(' ')
}
