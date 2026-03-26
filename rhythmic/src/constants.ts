export type MusicTheme = {
    id: string;
    name: string;
    tracks: string[];
    backgroundIndex: number;
    evolution?: number[]; // indices of BACKGROUNDS for progression
};

export const MUSIC_THEMES: MusicTheme[] = [
    { id: "piano", name: "Piano", tracks: ["/piano1.mp3", "/piano2.mp3", "/piano3.mp3", "/piano4.mp3"], backgroundIndex: 0 },
    {
        id: "violin",
        name: "Violin",
        tracks: ["/violin1.mp3"],
        backgroundIndex: 0, // Placeholder, usually overridden if evolution exists
        evolution: [9, 10, 11, 12]
    },
    { id: "ambient", name: "Ambient", tracks: ["/violin3.mp3"], backgroundIndex: 2 },
];

export function getMusicThemeById(id: string | null | undefined): MusicTheme {
    const theme = MUSIC_THEMES.find(t => t.id === id);
    return theme ?? MUSIC_THEMES[0];
}

// Backward-compatible playlist
export const PLAYLIST = MUSIC_THEMES.flatMap(t => t.tracks);

// Backgrounds
export const BACKGROUNDS = [
    "url('/snow.png')",
    "url('/morning.png')",
    "url('/nature.png')",
    "url('/alps.png')",
    "url('/beach.png')",
    "url('/galaxy.png')",
    "url('/abstract.png')",
    "url('/colors.png')",
    "url('/swiss.png')",
    // Evolution stages for Violin Study
    "url('/violin_evolve_1.png')",
    "url('/violin_evolve_2.png')",
    "url('/violin_evolve_3.png')",
    "url('/violin_evolve_4.png')"
];
