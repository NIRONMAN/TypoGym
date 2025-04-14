import { create } from "zustand";
import realWords from "../public/words.json";
import artificialWords from "../public/artificialWords.json";

const CurrentWordSet = artificialWords;
export type CharKeyType = keyof typeof CurrentWordSet;

interface TypingSessionTypes {
  currentSessionString: string;
  currentLetterIndex: number;
  isSessionStarted: boolean;
  currentLetter:CharKeyType | null;
  setCurrentSessionString: (str: string) => void;
  alphabetSession: (letter: CharKeyType) => void;
  toggleSessionStart: (isStart?: boolean) => void;
  setCurrentIndex: (idx: number) => void;

}
function createPracticeList(CurrentWordSet: string[], count: number): string {
  return Array.from(
    { length: count },
    () => CurrentWordSet[Math.floor(Math.random() * CurrentWordSet.length)]
  ).join(" ");
}
export const useTypingSession = create<TypingSessionTypes>((set) => ({
  currentSessionString: "",
  isSessionStarted: false,
  currentLetterIndex: 0,
  currentLetter:null,
  setCurrentSessionString: (str) =>
    set({
      currentSessionString: str,
    }),
  alphabetSession: (letter) =>
    set((state) => ({
      currentSessionString: createPracticeList(CurrentWordSet[letter], 25),
      currentLetterIndex:0,
      currentLetter:letter
    })),

  toggleSessionStart: (isStart) => set((state)=>({ isSessionStarted: typeof isStart==="boolean"?isStart:!state.isSessionStarted })),

  setCurrentIndex: (idx) => set({ currentLetterIndex: idx }),
}));
