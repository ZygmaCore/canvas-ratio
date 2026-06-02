"use client";

type TimeRangeInputProps = {
  startValue: string;
  endValue: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  disabled?: boolean;
  testIdPrefix?: string;
};

export function TimeRangeInput({
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  disabled = false,
  testIdPrefix,
}: TimeRangeInputProps) {
  const handleStartValue = (value: string) => {
    onStartChange(value);
  };
  const handleEndValue = (value: string) => {
    onEndChange(value);
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block">
        <span className="text-sm font-black uppercase text-[#2F5FBF]">
          Start
        </span>
        <input
          type="time"
          value={startValue}
          disabled={disabled}
          data-testid={testIdPrefix ? `${testIdPrefix}-start` : undefined}
          onChange={(event) => handleStartValue(event.currentTarget.value)}
          onInput={(event) => handleStartValue(event.currentTarget.value)}
          className="mt-2 min-h-11 w-full border-2 border-[#1A1A1A] bg-[#FFFFFF] px-3 py-2 text-base font-bold disabled:bg-[#FFD7BF]"
        />
      </label>
      <label className="block">
        <span className="text-sm font-black uppercase text-[#2F5FBF]">
          End
        </span>
        <input
          type="time"
          value={endValue}
          disabled={disabled}
          data-testid={testIdPrefix ? `${testIdPrefix}-end` : undefined}
          onChange={(event) => handleEndValue(event.currentTarget.value)}
          onInput={(event) => handleEndValue(event.currentTarget.value)}
          className="mt-2 min-h-11 w-full border-2 border-[#1A1A1A] bg-[#FFFFFF] px-3 py-2 text-base font-bold disabled:bg-[#FFD7BF]"
        />
      </label>
    </div>
  );
}
