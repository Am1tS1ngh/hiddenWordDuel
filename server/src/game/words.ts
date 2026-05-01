const words: string[] = [
    // 4-letter words
    'blue', 'calm', 'cold', 
    'warm', 'dark', 'glow', 
    'rain', 'help', 'iron', 
    'jazz', 'kite', 'jump', 
    'king', 'lamb', 'lion',
    'moon', 'nest', 'open', 
    'plan', 'rain', 'salt',
    'time', 'unit', 'vote',

    // 5-letter words
    'apple', 'beach', 'bread',
    'chair', 'cloud', 'craft',
    'dream', 'eagle', 'earth',
    'fairy', 'fight', 'glass',
    'happy', 'heart', 'house',
    'juice', 'knife', 'light',
    'money', 'music', 'night',
    'ocean', 'party', 'queen',
    'river', 'snake', 'sound',
    'tiger', 'train', 'truth',
    'video', 'virus', 'water',
    'yield', 'zebra',

    // 6-letter words
    'bridge', 'castle', 'desert', 
    'engine', 'forest', 'garden', 
    'hidden', 'island', 'jungle',
    'knight', 'launch', 'market', 
    'narrow', 'orange', 'planet',

    // 7-letter words
    'airport', 'balance', 'cabinet', 
    'diamond', 'economy', 'fashion', 
    'gateway', 'harvest', 'imagine', 
    'journey',
    
    // 8-letter words
    'absolute', 'backbone', 'calendar',
    'database', 'elephant', 'featured',
    'generate', 'handsome', 'industry',
    'judgment',
]

export function getRandomWord(): string {
    return words[Math.floor(Math.random() * words.length)];
}