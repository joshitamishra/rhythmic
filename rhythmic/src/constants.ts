const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

// Expanded playlist: each track appears twice in a row
export const PLAYLIST = [
    "/vilion1.mp3",
    "/vilion1.mp3",
    "/vilion2.mp3",
    "/vilion2.mp3",
    "/vilion3.mp3",
    "/vilion3.mp3",
    "/piano1.mp3",
    "/piano1.mp3",
    "/piano2.mp3",
    "/piano2.mp3",
    "/piano3.mp3",
    "/piano3.mp3",
    "/piano4.mp3",
    "/piano4.mp3"
];

// Shuffle backgrounds so every session is unique
export const BACKGROUNDS = shuffle([
    "url('/alps_better.png')",
    "url('/beach_sunset_better.png')",
    "url('/milky_way_better.png')",
    "url('/dark_abstract_better.png')",
    "url('/colours.png')",
    "url('/Serene%20afternoon%20in%20the%20Swiss%20Alps.png')"
]);
