export const ROUND_CONFIGS = [
    {
        pairs: 3,
        positions: [
            [-0.8, -0.5], [0.0, -0.5], [0.8, -0.5],
            [-0.8, 0.5], [0.0, 0.5], [0.8, 0.5],
        ]
    },
    {
        pairs: 4,
        positions: [
            [-1.2, -0.5], [-0.4, -0.5], [0.4, -0.5], [1.2, -0.5],
            [-1.2, 0.5], [-0.4, 0.5], [0.4, 0.5], [1.2, 0.5],
        ]
    },
    {
        pairs: 6,
        positions: [
            [-1.2, -1.0], [-0.4, -1.0], [0.4, -1.0], [1.2, -1.0],
            [-1.2, 0.0], [-0.4, 0.0], [0.4, 0.0], [1.2, 0.0],
            [-1.2, 1.0], [-0.4, 1.0], [0.4, 1.0], [1.2, 1.0],
        ]
    },
];

export const SYMBOL_NAMES = [
    'alpha', 'and', 'any', 'bssos', 'epsilon', 'exists', 'false',
    'imply', 'lambda', 'not', 'nothing', 'or', 'phi', 'prolog',
    'semantic', 'sigma', 'ssos', 'syntactic', 'tau', 'true', 'xi',
];

export const COLOR_TYPES = [
    { id: 'red', hex: 0xff4444 },
    { id: 'blue', hex: 0x4444ff },
    { id: 'green', hex: 0x44ff44 },
    { id: 'yellow', hex: 0xffff44 },
    { id: 'purple', hex: 0xaa44ff },
    { id: 'cyan', hex: 0x44ffff },
];

// Symbols that have a matching .wav in cristi_samples/
export const SYMBOL_SOUNDS = new Set([
    'bssos', 'epsilon', 'false', 'nothing', 'phi',
    'prolog', 'sigma', 'ssos', 'true', 'xi',
]);

// Root-level wav files with no direct symbol match, used as fallback
export const RANDOM_MATCH_SOUNDS = [
    'bold.wav', 'haskell 2.wav', 'leustean.wav',
    'nothing_again.wav', 'nothing_again_again.wav',
    'prolog_again.wav', 'puterea prologului.wav',
];

export const START_OF_ROUND_SOUNDS = [
    'axiome hoar.wav', 'functie.wav', 'puterea prologului 2.wav',
];

export const END_OF_ROUND_SOUNDS = [
    'bssos & sssos 2.wav', 'prefac ca am inteles.wav', 'prologul nu se termina 2.wav',
];
