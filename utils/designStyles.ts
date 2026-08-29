export interface DesignStyle {
  id: string
  name: string
  icon: string
  prompt: string
}

export const designStyles: DesignStyle[] = [
  {
    id: 'minimalist',
    name: 'Minimalist',
    icon: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" d="M4 12h16"/></svg>',
    prompt: 'minimalist interior: clean lines, uncluttered surfaces, restrained furniture, a calm neutral palette',
  },
  {
    id: 'scandinavian',
    name: 'Scandinavian',
    icon: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4"/></svg>',
    prompt: 'Scandinavian interior: light woods, white walls, cozy textiles, abundant natural light, simple functional furniture',
  },
  {
    id: 'japandi',
    name: 'Japandi',
    icon: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2"/></svg>',
    prompt: 'Japandi interior: Japanese-Scandinavian mix, low furniture, natural materials, wabi-sabi warmth, muted earth tones',
  },
  {
    id: 'industrial',
    name: 'Industrial',
    icon: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 3v2m6-2v2M4 9h16M6 9v12h12V9"/></svg>',
    prompt: 'industrial interior: exposed brick or concrete, black metal, vintage leather, factory lighting, raw textures',
  },
  {
    id: 'luxury',
    name: 'Luxury',
    icon: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3l2.2 6.8H21l-5.5 4 2.1 6.7L12 16.8 6.4 20.5l2.1-6.7L3 9.8h6.8L12 3z"/></svg>',
    prompt: 'luxury interior: rich materials, marble and velvet, statement lighting, tailored furniture, elegant high-end finishes',
  },
  {
    id: 'muji',
    name: 'Japanese Muji',
    icon: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" d="M4 8h16M4 12h16M4 16h16"/></svg>',
    prompt: 'Japanese Muji interior: pale wood, linen, hidden storage, airy emptiness, understated organic simplicity',
  },
  {
    id: 'bohemian',
    name: 'Bohemian',
    icon: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21c4-4 7-7.5 7-11a7 7 0 10-14 0c0 3.5 3 7 7 11z"/></svg>',
    prompt: 'bohemian interior: layered textiles, plants, warm eclectic colors, rattan and vintage pieces, collected lived-in warmth',
  },
  {
    id: 'mid-century',
    name: 'Mid-century',
    icon: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M12 5v14M7 7l10 10M17 7L7 17"/></svg>',
    prompt: 'mid-century modern interior: tapered wood legs, organic curves, walnut tones, retro lighting, 1950s-60s furniture',
  },
]

export const designStyleIds = designStyles.map((style) => style.id)

export function getDesignStyle(id: string) {
  return designStyles.find((style) => style.id === id) ?? null
}

export function isDesignStyleId(id: string) {
  return designStyleIds.includes(id)
}

export function buildStylePrompt(styleId: string) {
  const style = getDesignStyle(styleId)
  const look = style?.prompt ?? `${styleId} interior design`
  const name = style?.name ?? styleId

  return [
    `Photorealistic interior redesign of this exact room in ${name} style.`,
    look.charAt(0).toUpperCase() + look.slice(1) + '.',
    'Keep the same room layout, architecture, camera angle, window placement, and proportions.',
    'Do not change the structure of the space.',
    'High-end architectural photography, realistic materials and lighting.',
  ].join(' ')
}
