export const GAMER_AVATARS = [
  "https://i.pinimg.com/736x/80/a6/b0/80a6b0f96ce5cc3bc3769904a63c64d8.jpg",
  "https://i.pinimg.com/736x/72/72/9f/72729f1e92194cbe40fda3d5ebe90b10.jpg",
  "https://i.pinimg.com/1200x/8c/91/a9/8c91a945feb6b114719acf4df04ff594.jpg",
  "https://i.pinimg.com/736x/8a/fc/98/8afc98ff298d4a545a9743fd35675c2a.jpg",
  "https://i.pinimg.com/736x/c4/9e/26/c49e26f5a8f8fe4227421610042875bc.jpg",
  "https://i.pinimg.com/736x/fa/f8/b6/faf8b6ed880dfec6c62c5028532a15db.jpg",
] as const;

export function getGamerAvatar(indexOrSeed?: number | string | null): string {
  if (typeof indexOrSeed === "number") {
    return GAMER_AVATARS[Math.abs(indexOrSeed) % GAMER_AVATARS.length];
  }
  if (typeof indexOrSeed === "string" && indexOrSeed.length > 0) {
    let hash = 0;
    for (let i = 0; i < indexOrSeed.length; i++) {
      hash = (hash << 5) - hash + indexOrSeed.charCodeAt(i);
      hash |= 0;
    }
    return GAMER_AVATARS[Math.abs(hash) % GAMER_AVATARS.length];
  }
  return GAMER_AVATARS[0];
}
