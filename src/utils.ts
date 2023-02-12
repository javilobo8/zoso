export function splitText(text: string, size = 64) {
  const lines = [];
  for (let i = 0, length = text.length; i < length; i += size) {
    lines.push(text.substring(i, i + size));
  }
  return lines.join('\n');
}

export function joinText(text: string) {
  const lines = text.split('\r\n');
  return lines.join('');
}

export function isContentEncrypted(content: string) {
  return content.split(':').length === 2 && /^[a-f0-9]{32}:{1}[a-f0-9\r\n]+$/.test(content);
}