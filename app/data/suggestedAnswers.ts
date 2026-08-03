const suggestedAnswers: Record<string, string> = {
    "who is head of racing for aston martin's f1 academy team?": `Jessica Hawkins is the head of racing for Aston Martin's F1 Academy programme. A former Aston Martin brand ambassador and racing driver herself, she took on the role to help develop young female talent and guide the team's F1 Academy entry.`,
    "who is the highest paid f1 driver?": `Max Verstappen is widely reported to be the highest paid driver on the Formula 1 grid, with a salary in the region of $55 million per year before bonuses, on top of his Red Bull contract extension that keeps him with the team through 2028. Lewis Hamilton follows close behind in the top earners, with both drivers regularly swapping the top spot depending on the latest deals.`,
    "who will be the newest driver for ferrari?": `Lewis Hamilton will become Ferrari's newest driver, joining the team for the 2025 Formula 1 season alongside Charles Leclerc. He makes the move from Mercedes, ending a hugely successful partnership there, and will chase a record-breaking eighth world championship in red.`,
    "who is the current formula one world driver's champion?": `Max Verstappen is the current Formula One World Drivers' Champion. He secured the 2024 title with Red Bull Racing, adding to his championship wins from 2021, 2022, and 2023, making it four consecutive world titles.`,
};

export const getSuggestedAnswer = (prompt: string): string | null => {
    const normalized = prompt.trim().toLowerCase();
    return suggestedAnswers[normalized] ?? null;
};
