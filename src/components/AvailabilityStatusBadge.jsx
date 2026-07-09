import { getMonthStatusLabel, getMonthStatusStyle } from "../lib/monthAvailability.js";

export default function AvailabilityStatusBadge({ status }) {
  const style = getMonthStatusStyle(status);

  return (
    <span className={`fine-label inline-flex items-center rounded-full px-3 py-1 text-[0.62rem] font-semibold text-coffee ${style.badge}`}>
      {getMonthStatusLabel(status)}
    </span>
  );
}
