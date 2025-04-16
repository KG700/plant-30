import { useState } from "react";
import { CalendarDays, ChevronDown, ChevronUp } from "../icons";
import { getDate } from "../utils";
import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";

interface CalendarProps {
  daysAgoActive: number;
  setDaysAgoActive: (daysAgo: number) => void;
}

interface CalendarButtonProps {
  value?: string;
  onClick: () => void;
}

export function Calendar({
  daysAgoActive,
  setDaysAgoActive,
}: Readonly<CalendarProps>) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  function CalendarButton(
    { value, onClick }: CalendarButtonProps,
    ref: React.Ref<HTMLButtonElement>,
  ) {
    return (
      <button
        onClick={onClick}
        className={`custom-input-container ${daysAgoActive > 6 ? "active" : ""}`}
        ref={ref}
        style={{ paddingLeft: "2.5rem" }}
        data-testid="calendar-button"
      >
        {daysAgoActive > 6 ? value : " "}
        {isCalendarOpen ? ChevronUp() : ChevronDown()}
      </button>
    );
  }

  const selectDate = (date: Date | null) => {
    if (!date) return;
    const daysAgo = Math.round(
      (getDate(0).getTime() - date.getTime()) / 86_400_000,
    );
    setDaysAgoActive(daysAgo);
  };

  return (
    <DatePicker
      showIcon
      icon={CalendarDays()}
      dateFormat={"dd MMM yyyy"}
      customInput={<CalendarButton onClick={() => setDaysAgoActive(7)} />}
      selected={getDate(daysAgoActive)}
      onChange={(date) => selectDate(date)}
      onCalendarOpen={() => setIsCalendarOpen(true)}
      onCalendarClose={() => setIsCalendarOpen(false)}
    />
  );
}
