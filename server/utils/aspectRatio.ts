const GROK_ASPECT_RATIOS = [
  '1:1',
  '3:4',
  '4:3',
  '9:16',
  '16:9',
  '2:3',
  '3:2',
  '9:19.5',
  '19.5:9',
  '9:20',
  '20:9',
  '1:2',
  '2:1',
] as const

export type GrokAspectRatio = (typeof GROK_ASPECT_RATIOS)[number]

function parseRatio(value: string) {
  const [width, height] = value.split(':').map(Number)
  return width / height
}

export function closestGrokAspectRatio(width: number, height: number): GrokAspectRatio {
  if (!width || !height) return '4:3'

  const target = Math.log(width / height)
  let best: GrokAspectRatio = '4:3'
  let bestDelta = Infinity

  for (const ratio of GROK_ASPECT_RATIOS) {
    const delta = Math.abs(target - Math.log(parseRatio(ratio)))
    if (delta < bestDelta) {
      best = ratio
      bestDelta = delta
    }
  }

  return best
}
