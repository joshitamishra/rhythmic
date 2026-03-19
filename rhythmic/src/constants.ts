export type MusicTheme = {
    id: string;
    name: string;
    tracks: string[];
    backgroundIndex: number;
};

export const MUSIC_THEMES: MusicTheme[] = [
    { id: "piano", name: "Piano", tracks: ["/piano1.mp3"], backgroundIndex: 0 },
    { id: "violin", name: "Violin", tracks: ["/vilion1.mp3"], backgroundIndex: 1 },
    { id: "ambient", name: "Ambient", tracks: ["/vilion3.mp3"], backgroundIndex: 2 },
];

export function getMusicThemeById(id: string | null | undefined): MusicTheme {
    const theme = MUSIC_THEMES.find(t => t.id === id);
    return theme ?? MUSIC_THEMES[0];
}

// Backward-compatible playlist (will be removed once all usages migrate).
export const PLAYLIST = MUSIC_THEMES.flatMap(t => t.tracks);

// Backgrounds with new ones first
export const BACKGROUNDS = [
    "url('/Snow.png')",
    "url('/baat.png')",
    "url('/leaves.png')",
    "url('/alps_better.png')",
    "url('/beach_sunset_better.png')",
    "url('/milky_way_better.png')",
    "url('/dark_abstract_better.png')",
    "url('/colours.png')",
    "url('/Serene%20afternoon%20in%20the%20Swiss%20Alps.png')"
];
