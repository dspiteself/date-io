import {
  Period,
  Duration,
  ZoneId,
  IsoFields,
  LocalDateTime,
  LocalDate,
  LocalTime,
  ZonedDateTime,
  DateTimeParseException,
  DateTimeFormatter,
  Instant,
  convert,
  Temporal,
  ZoneOffset,
  DateTimeFormatterBuilder,
  ResolverStyle,
  IsoChronology,
  ChronoField,
  TemporalAccessor,
  ChronoUnit,
  YearMonth,
  DayOfWeek,
  TemporalAdjuster,
  Month,
  Year,
  TemporalUnit,
  TemporalQueries
} from "@js-joda/core";
import {
  Locale
} from "@js-joda/locale_en-us";
import {DateIOFormats, IUtils, Unit} from "@date-io/core/IUtils";


type CalendarType = LocalDateTime | LocalDate | ZonedDateTime;


const isoformatter = new DateTimeFormatterBuilder().parseCaseInsensitive().append(DateTimeFormatter.ISO_LOCAL_DATE).appendLiteral('T').append(DateTimeFormatter.ISO_LOCAL_TIME).appendLiteral(".").appendValue(ChronoField.MICRO_OF_SECOND, 3).appendLiteral("Z").toFormatter(ResolverStyle.STRICT).withChronology(IsoChronology['INSTANCE']);

const OPTIONAL_FORMATTER = DateTimeFormatter.ofPattern(
  "yyyy-MM-dd['T'HH:mm[:ss[.SSS['Z']]]"
);
const ampmregex =new RegExp('.*a.*');
// create a temporal query that create a new Temporal depending on the existing fields
const dateOrDateTimeQuery = {
  queryFrom: function(temporal) {
    var date = temporal.query(TemporalQueries.localDate());
    var time = temporal.query(TemporalQueries.localTime());
    if (time == null) return date;
    else return date.atTime(time);
  }
};
// v2.0.0
//
interface Opts {
  locale?: Locale;
  formats?: Partial<DateIOFormats>;
}

const defaultFormats: DateIOFormats = {
  dayOfMonth: "d",
  fullDate: "LLL d, yyyy",
  fullDateWithWeekday: "EEEE, LLLL d, yyyy",
  fullDateTime: "LLL d, yyyy hh:mm a",
  fullDateTime12h: "LLL d, yyyy hh:mm a",
  fullDateTime24h: "LLL d, yyyy HH:mm",
  fullTime: "hh:mm a",
  fullTime12h: "hh:mm a",
  fullTime24h: "HH:mm",
  hours12h: "hh",
  hours24h: "HH",
  keyboardDate: "MM/dd/yyyy",
  keyboardDateTime: "MM/dd/yyyy hh:mm a",
  keyboardDateTime12h: "MM/dd/yyyy hh:mm a",
  keyboardDateTime24h: "MM/dd/yyyy HH:mm",
  minutes: "mm",
  month: "LLLL",
  monthAndDate: "LLLL d",
  monthAndYear: "LLLL yyyy",
  monthShort: "LLL",
  weekday: "EEEE",
  weekdayShort: "EEE",
  normalDate: "d MMMM",
  normalDateWithWeekday: "EEE, MMM d",
  seconds: "ss",
  shortDate: "MMM d",
  year: "yyyy",
};


function getChronoUnit(unit?: Unit): ChronoUnit {
  switch (unit) {
    case "years":
      return ChronoUnit.YEARS;
    case "quarters":
      return null;
    case "months":
      return ChronoUnit.MONTHS;
    case "weeks":
      return ChronoUnit.WEEKS;
    case "days":
      return ChronoUnit.DAYS;
    case "hours":
      return ChronoUnit.HOURS;
    case "minutes":
      return ChronoUnit.MINUTES;
    case "seconds":
      return ChronoUnit.SECONDS;
    default: {
      return ChronoUnit.MILLIS;
    }
  }
}

export default class JsJodaUtils implements IUtils<Temporal> {
  public lib: "joda-time";
  public locale?: Locale;
  public formats: DateIOFormats;

  constructor({locale, formats}: { formats?: Partial<DateIOFormats>; locale?: Locale } = {}) {
    this.locale = locale || Locale.US;
    this.formats = Object.assign({}, defaultFormats, formats);
  }

  public parse(value: string, format: string): Temporal | null {
    if (value === "") {
      return null;
    }

    let formatter = DateTimeFormatter.ofPattern(format).withLocale(this.locale);

    try {
      let parsed_assessor = formatter.parse(value);
      if (parsed_assessor.isSupported(ChronoField.YEAR)
        && parsed_assessor.isSupported(ChronoField.MONTH_OF_YEAR)
        && parsed_assessor.isSupported(ChronoField.DAY_OF_MONTH)) {
        if (parsed_assessor.isSupported(ChronoField.HOUR_OF_DAY)
          && parsed_assessor.isSupported(ChronoField.MINUTE_OF_HOUR)
          && parsed_assessor.isSupported(ChronoField.SECOND_OF_MINUTE)) {
          return LocalDateTime.from(parsed_assessor)
        }
        else {
          return LocalDate.from(parsed_assessor);
        }
      }
    } catch (ex) {
      if (ex instanceof DateTimeParseException) {
        return <Temporal><unknown>ex;
      }
    }

  }

  public date(value?: any): Temporal | null {
    if (value === null) {
      return null;
    }
    if (value === undefined) {
      return LocalDateTime.now();
    }

    if (typeof value === "string") {
      try {
        return  OPTIONAL_FORMATTER.parse(value, dateOrDateTimeQuery);
      } catch (ex) {
        if (ex instanceof DateTimeParseException) {
          return <Temporal><unknown>ex;
        }
      }
    }

    if (value instanceof Temporal) {
      return value;
    }

    if (value instanceof Date) {
      const instant = Instant.ofEpochMilli(value.valueOf());
      return LocalDateTime.ofInstant(instant, ZoneId.systemDefault());
    }

    // throw new Error(`Unknown Date value in function date(): ${value}`);
  }

  public isNull(date: Temporal | null): boolean {
    return date === null;
  }

  public isValid(value: any): boolean {
    if (value instanceof Error) {
      return false;
    }

    if (value === null) {
      return false;
    }

    if (value === undefined) {
      return true;
    }

    // if (value instanceof Date) {
    //   return !isNaN(value.valueOf());
    // }

    if (typeof value === "string") {
      return !isNaN(new Date(value).valueOf());
    }

    if (value instanceof Temporal) {
      return true;
    }

    // throw new Error(`Unknown Date value in function isValid(): ${value}`);
  }

  public getDiff = (value: CalendarType, comparing: CalendarType | string, unit?: Unit) => {
    let chronoUnit = getChronoUnit(unit);
    if (chronoUnit === null) {
      switch (unit) {
        case "quarters":
          return Math.floor(ChronoUnit.MONTHS.between(this.date(comparing), value) / 4);
      }
    } else {
      return chronoUnit.between(this.date(comparing), value);
    }
  };

  public isEqual(value: any, comparing: any): boolean {
    const first = this.date(value);
    const second = this.date(comparing);
    if (first === null && second === null) {
      return true;
    }
    if (first === null || second === null) {
      return false;
    }
    // if (first instanceof Error || second instanceof Error) {
    //   throw first || second;
    // }
    if (first instanceof LocalDateTime && second instanceof LocalDateTime) {
      return first.isEqual(second);
    }
    if (first instanceof LocalDate && second instanceof LocalDate) {
      return first.isEqual(second);
    }
    // return false;
  }

  public isSameDay(date: Temporal, comparing: Temporal): boolean {
    return LocalDate.from(date).isEqual(LocalDate.from(comparing));
  }

  public isSameMonth(date: Temporal, comparing: Temporal): boolean {
    return YearMonth.from(date).equals(YearMonth.from(comparing));
  }

  public isSameYear(date: Temporal, comparing: Temporal): boolean {
    return Year.from(date).equals(Year.from(comparing));
  }

  public isSameHour(date: Temporal, comparing: Temporal): boolean {
    return (
      date.get(ChronoField.HOUR_OF_DAY) === comparing.get(ChronoField.HOUR_OF_DAY) &&
      date.get(ChronoField.DAY_OF_MONTH) === comparing.get(ChronoField.DAY_OF_MONTH) &&
      date.get(ChronoField.MONTH_OF_YEAR) === comparing.get(ChronoField.MONTH_OF_YEAR) &&
      date.get(ChronoField.YEAR) === comparing.get(ChronoField.YEAR)
    );
  }

  public isAfter(date: Temporal, value: Temporal): boolean {
    if (date instanceof LocalDateTime && value instanceof LocalDateTime) {
      return date.isAfter(value);
    } else if (date instanceof LocalDate && value instanceof LocalDate) {
      return date.isAfter(value);
    }

  }

  public isAfterDay(date: Temporal, value: Temporal): boolean {
    let datedate = LocalDate.from(date);
    let valuedate = LocalDate.from(value);
    return datedate.isAfter(valuedate);
  }

  public isAfterYear(date: Temporal, value: Temporal): boolean {
    let datedate = Year.from(date);
    let valuedate = Year.from(value);
    return datedate.isAfter(valuedate);
  }

  public isBeforeDay(date: Temporal, value: Temporal): boolean {
    let datedate = LocalDate.from(date);
    let valuedate = LocalDate.from(value);
    return datedate.isBefore(valuedate);
  }

  public isBeforeYear(date: Temporal, value: Temporal): boolean {
    let datedate = Year.from(date);
    let valuedate = Year.from(value);
    return datedate.isBefore(valuedate);
  }

  public startOfMonth(date: Temporal) {
    return YearMonth.from(date).atDay(1).atStartOfDay();
  }

  public endOfMonth(date: Temporal) {
    return YearMonth.from(date).atEndOfMonth().atTime(LocalTime.MAX);
  }

  public addDays(date: Temporal, count: number): Temporal {
    return date.plus(count, ChronoUnit.DAYS);
  }

  public startOfDay(date: Temporal) {
    return LocalDate.from(date).atStartOfDay();
  }

  public endOfDay(date: Temporal) {
    return LocalDate.from(date).atTime(LocalTime.MAX);
  }

  public format(date: Temporal, formatKey: keyof DateIOFormats): string {
    let formatter = DateTimeFormatter.ofPattern(this.formats[formatKey]).withLocale(this.locale);
    return formatter.format(date);
  }

  public formatByString(date: Temporal, formatString: string): string {
    let formatter = DateTimeFormatter.ofPattern(formatString).withLocale(this.locale);
    return formatter.format(date);
  }

  public formatNumber(numberToFormat: string): string {
    return numberToFormat;
  }

  public getHours(date: Temporal): number {
    return date.get(ChronoField.HOUR_OF_DAY);
  }

  public setHours(date: Temporal, count: number): Temporal {
    return date.with(ChronoField.HOUR_OF_DAY, count);
  }

  public getMinutes(date: Temporal): number {
    return date.get(ChronoField.MINUTE_OF_HOUR);
  }

  public setMinutes(date: Temporal, count: number): Temporal {
    return date.with(ChronoField.MINUTE_OF_HOUR, count);
  }

  public getSeconds(date: Temporal): number {
    return date.get(ChronoField.SECOND_OF_MINUTE);
  }

  public setSeconds(date: Temporal, count: number): Temporal {
    return date.with(ChronoField.SECOND_OF_MINUTE, count);
  }

  public getMonth(date: Temporal): number {
    return date.get(ChronoField.MONTH_OF_YEAR) - 1;
  }

  public setMonth(date: Temporal, count: number): Temporal {
    return date.with(ChronoField.MONTH_OF_YEAR, count + 1);
  }

  public getPreviousMonth(date: Temporal): Temporal {
    return date.minus(1, ChronoUnit.MONTHS);
    // return YearMonth.from(date).minusMonths(1).atDay(1).atStartOfDay();
  }

  public getNextMonth(date: Temporal): Temporal {
    return date.plus(1, ChronoUnit.MONTHS);
    // return YearMonth.from(date).plusMonths(1).atDay(1).atStartOfDay();
  }

  public getMonthArray(date: Temporal): LocalDateTime[] {
    const months: Array<LocalDateTime> = [];
    const year: Year = Year.from(date);
    for (let i = 1; i <= 12; i++) {
      const localDateTime = year.atMonth(i).atDay(1).atStartOfDay();
      months.push(localDateTime);
    }
    return months;
  }

  public getYear(date: Temporal): number {
    return date.get(ChronoField.YEAR);
  }

  public setYear(date: Temporal, year: number): Temporal {
    return date.with(ChronoField.YEAR, year);
  }

  public mergeDateAndTime(date: Temporal, time: Temporal): Temporal {
    return LocalDate.from(date).atTime(LocalTime.from(time));
  }

  public getWeekdays(): string[] {
    const today = LocalDate.now();
    const startOfWeek = LocalDate.from(this.startOfWeek(today));

    const weekdays = [];
    const formatter = DateTimeFormatter.ofPattern("eee").withLocale(this.locale);
    for (let i = 0; i < 7; i++) {
      weekdays.push(startOfWeek.plus(i, ChronoUnit.DAYS).format(formatter));
    }
    return weekdays;
  }

  public getWeekArray(date: Temporal) {
    // if (!this.locale) {
    //   throw new Error("Function getWeekArray() requires a locale to be set.");
    // }
    let startOfMonth = LocalDate.from(this.startOfMonth(date));
    let endOfMonth = LocalDate.from(this.endOfMonth(date));
    const start = LocalDate.from(this.startOfWeek(startOfMonth));
    const end = LocalDate.from(this.endOfWeek(endOfMonth));

    let count = 0;
    let current = start;
    const nestedWeeks: LocalDate[][] = [];


    while (current.isBefore(end) || current.isEqual(end)) {
      const weekNumber = Math.floor(count / 7);
      nestedWeeks[weekNumber] = nestedWeeks[weekNumber] || [];
      nestedWeeks[weekNumber].push(current);
      current = current.plusDays(1);
      count += 1;
    }
    return nestedWeeks;
  }

  public getYearRange(start: Temporal, end: Temporal) {
    const years: Temporal[] = [];
    let startYear = Year.from(start);
    let endYear= Year.from(end).plusYears(1);
    while (startYear.isBefore(endYear)) {
      years.push(startYear.atDay(1).atStartOfDay());
      startYear = startYear.plusYears(1);
    }
    return years;
  }

  public isBefore(date: Temporal, value: Temporal): boolean {
    if ((date instanceof LocalDateTime) && (value instanceof LocalDateTime)) {
      return date.isBefore(value);
    } else if ((date instanceof LocalDate) && (value instanceof LocalDate)) {
      return date.isBefore(value);
    }
  }

  public getMeridiemText(ampm: "am" | "pm"): string {
    return ampm === "am" ? "AM" : "PM";
  }

  private naDayOfWeekFix(x: number): number {
    switch (x) {
      case 7:
        return 1;
      default:
        return x + 1;
    }
  }

  private localedayOfWeekValue(value: LocalDate): number {
    switch (this.locale.country()) {
      case "US":
        return this.naDayOfWeekFix(value.dayOfWeek().value()); // Sunday (day 7 in js-joda, which implements ISO8601 calendar only)
      default:
        return value.dayOfWeek().value();
    }
  }


  public startOfWeek(value: Temporal) {
    const day = LocalDate.from(value);
    const dayOfWeek = this.localedayOfWeekValue(day);
    return day.minus(dayOfWeek - 1, ChronoUnit.DAYS).atStartOfDay();
  }

  public endOfWeek(value: Temporal) {
    const day = LocalDate.from(value);
    const daysToEnd = 7 - this.localedayOfWeekValue(day);
    return day.plus(daysToEnd, ChronoUnit.DAYS).atTime(LocalTime.MAX);
  }

  addHours(value: Temporal, count: number): Temporal {
    return value.plus(count, ChronoUnit.HOURS);
  }

  addMinutes(value: Temporal, count: number): Temporal {
    return value.plus(count, ChronoUnit.MINUTES);
  }

  addMonths(value: Temporal, count: number): Temporal {
    return value.plus(count, ChronoUnit.MONTHS);
  }

  addSeconds(value: Temporal, count: number): Temporal {
    return value.plus(count, ChronoUnit.SECONDS);
  }

  addWeeks(value: Temporal, count: number): Temporal {
    return value.plus(count, ChronoUnit.WEEKS);
  }

  getCurrentLocaleCode(): string {
    return this.locale.localeString();

  }

  getDaysInMonth(value: Temporal): number {
    return YearMonth.from(value).lengthOfMonth();
  }

  public getFormatHelperText = (format: string) => {
    return format
      .replace(/(aaa|aa|a)/g, "(a|p)m")
      .toLocaleLowerCase();
  };

  is12HourCycleInCurrentLocale(): boolean {
    return ampmregex.test(this.formats.fullDateTime);
  }

  isWithinRange(value: Temporal, range: [Temporal, Temporal]): boolean {
    let [start, end] = range;
    if ((value instanceof LocalDateTime) && (start instanceof LocalDateTime) && (end instanceof LocalDateTime)) {
      return (value.isAfter(start) || value.isEqual(start)) && (value.isBefore(end) || value.isEqual(end));
    } else if ((value instanceof LocalDate) && (start instanceof LocalDate) && (end instanceof LocalDate)) {
      return (value.isAfter(start) || value.isEqual(start)) && (value.isBefore(end) || value.isEqual(end));
    }
  }

  parseISO(isString: string): Temporal {
    return ZonedDateTime.parse(isString).toLocalDateTime();
  }

  toISO(value: Temporal): string {
    return isoformatter.format(value);
  }

  toJsDate(value: CalendarType): Date {
    return convert(value).toDate()
  }
}
