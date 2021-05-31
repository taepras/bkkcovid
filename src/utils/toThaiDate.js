import { DateTime } from "luxon";

export const toThaiDate = (date, showDayOfWeek) => {
  let dt = date;
  if (typeof date === "string") dt = DateTime.fromISO(date);

  const monthString = [
    "",
    "ม.ค.",
    "ก.พ.",
    "มี.ค.",
    "เม.ย.",
    "พ.ค.",
    "มิ.ย.",
    "ก.ค.",
    "ส.ค.",
    "ก.ย.",
    "ต.ค.",
    "พ.ย.",
    "ธ.ค. ",
  ];

  const weekDayAbbr = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."];

  const dow = showDayOfWeek ? `${weekDayAbbr[dt?.weekday ?? 0]} ` : " ";

  return dt && !Number.isNaN(dt.get("day"))
    ? `${dow}${dt.get("day")} ${monthString[dt.get("month")]} ${
        (dt.get("year") + 543) % 100
      }`
    : "";
};
