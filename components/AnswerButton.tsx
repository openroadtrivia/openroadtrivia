'use client';

interface AnswerButtonProps {
  answers: string[];
  correctIndex: number;
  selectedIndex: number | null;
  onPick: (index: number) => void;
  hintEliminated?: number[];
}

export default function AnswerButton({ answers, correctIndex, selectedIndex, onPick, hintEliminated = [] }: AnswerButtonProps) {
  const answered = selectedIndex !== null;

  return (
    <div className="flex flex-col gap-2">
      {answers.map((text, i) => {
        const isEliminated = hintEliminated.includes(i);
        if (isEliminated && !answered) return null;

        let cls = 'answer-btn w-full';
        if (answered) {
          if (i === correctIndex) cls = 'answer-btn answer-correct w-full font-semibold';
          else if (i === selectedIndex) cls = 'answer-btn answer-wrong w-full';
          else cls = 'answer-btn answer-neutral w-full';
        }

        const letter = ['A', 'B', 'C', 'D'][i];

        return (
          <button
            key={i}
            onClick={() => !answered && onPick(i)}
            disabled={answered}
            className={cls}
          >
            <div className="flex items-start gap-3">
              <span className={`font-mono font-bold text-sm mt-0.5 ${
                answered && i === correctIndex ? 'text-green-600' :
                answered && i === selectedIndex ? 'text-red-500' :
                answered ? 'text-gray-300' : 'text-amber-500'
              }`}>
                {letter}
              </span>
              <span className="flex-1 text-sm leading-relaxed">{text}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
