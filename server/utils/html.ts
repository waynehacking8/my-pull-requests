const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }

// For text from GitHub (PR titles, URLs) placed inside HTML we build by hand.
export const escapeHtml = (text: string) => text.replace(/[&<>"']/g, c => ENTITIES[c]!)
