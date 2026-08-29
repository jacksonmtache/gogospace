export async function downloadImage(url: string, filename: string) {
  const response = await fetch(url)
  if (!response.ok) {
    window.open(url, '_blank', 'noopener,noreferrer')
    return
  }

  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(objectUrl)
}
