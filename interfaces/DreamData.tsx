// interfaces/DreamData.ts
// Extension compatible (les anciens objets restent valides)
export interface DreamData {
  dreamText: string;
  isLucidDream: boolean;

  // Champs optionnels utilisés par la liste
  dateISO?: string;              // source fiable (ex: "2025-10-24T10:20:00.000Z")
  dateDisplay?: string;          // ex: "24/10/2025"
  timeDisplay?: string;          // ex: "12:20"
  title?: string;                // titre facultatif
  tags?: string[];               // max 3, ex: ["forêt","chasse","froid"]
  emotions?: string[];           // ex: ["joie","peur"]
  dreamType?: 'lucid' | 'nightmare' | 'pleasant'; // type de rêve
}
