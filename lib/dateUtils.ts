/**
 * Date and Age calculation utilities for "Para Você"
 */

export function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  return new Date(year, month - 1, day);
}

export function formatDatePortuguese(dateStr: string, options: { short?: boolean; withYear?: boolean } = {}): string {
  if (!dateStr) return '';
  const date = parseDate(dateStr);
  const months = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];
  const shortMonths = [
    'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
    'jul', 'ago', 'set', 'out', 'nov', 'dez'
  ];

  const day = date.getDate();
  const month = options.short ? shortMonths[date.getMonth()] : months[date.getMonth()];
  const year = date.getFullYear();

  if (options.short) {
    return `${day} de ${month}${options.withYear !== false ? `, ${year}` : ''}`;
  }

  return `${day} de ${month}${options.withYear !== false ? ` de ${year}` : ''}`;
}

export function calculateAgePortuguese(birthDateStr: string, targetDateStr?: string): string {
  if (!birthDateStr) return '';
  const birth = parseDate(birthDateStr);
  const target = targetDateStr ? parseDate(targetDateStr) : new Date();

  // If target is before birth
  if (target < birth) {
    return 'Antes do nascimento';
  }

  const diffTime = target.getTime() - birth.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Dia do nascimento';
  }

  if (diffDays < 30) {
    return diffDays === 1 ? '1 dia de vida' : `${diffDays} dias de vida`;
  }

  // Calculate years, months, days
  let years = target.getFullYear() - birth.getFullYear();
  let months = target.getMonth() - birth.getMonth();
  let days = target.getDate() - birth.getDate();

  if (days < 0) {
    months -= 1;
    // get days in previous month of target
    const prevMonthLastDay = new Date(target.getFullYear(), target.getMonth(), 0).getDate();
    days += prevMonthLastDay;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years === 0) {
    if (months === 0) {
      return days === 1 ? '1 dia de vida' : `${days} dias de vida`;
    }
    const monthText = months === 1 ? '1 mês' : `${months} meses`;
    if (days === 0) return `${monthText} de vida`;
    const dayText = days === 1 ? '1 dia' : `${days} dias`;
    return `${monthText} e ${dayText} de vida`;
  }

  const yearText = years === 1 ? '1 ano' : `${years} anos`;
  if (months === 0 && days === 0) {
    return `${yearText} de vida`;
  }

  if (months === 0) {
    const dayText = days === 1 ? '1 dia' : `${days} dias`;
    return `${yearText} e ${dayText}`;
  }

  const monthText = months === 1 ? '1 mês' : `${months} meses`;
  return `${yearText} e ${monthText}`;
}

export function getLifeStage(birthDateStr: string, targetDateStr?: string): string {
  if (!birthDateStr) return 'Nascimento';
  const birth = parseDate(birthDateStr);
  const target = targetDateStr ? parseDate(targetDateStr) : new Date();

  const diffTime = target.getTime() - birth.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 30) return 'Nascimento';
  if (diffDays <= 365) return 'Primeiro ano';
  
  const years = diffDays / 365.25;
  if (years < 2) return '1–2 anos';
  if (years < 3) return '2–3 anos';
  if (years < 5) return '3–5 anos';
  if (years < 10) return '5–10 anos';
  if (years < 15) return '10–15 anos';
  if (years < 18) return 'Adolescência';
  return 'Vida adulta';
}

export function getNextBirthdayCountdown(birthDateStr: string): {
  isToday: boolean;
  daysRemaining: number;
  nextAge: number;
  message: string;
} {
  if (!birthDateStr) {
    return { isToday: false, daysRemaining: 0, nextAge: 0, message: '' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const birth = parseDate(birthDateStr);
  
  const currentYear = today.getFullYear();
  let nextBirthday = new Date(currentYear, birth.getMonth(), birth.getDate());
  nextBirthday.setHours(0, 0, 0, 0);

  if (today.getMonth() === birth.getMonth() && today.getDate() === birth.getDate()) {
    const currentAge = currentYear - birth.getFullYear();
    return {
      isToday: true,
      daysRemaining: 0,
      nextAge: currentAge,
      message: `Hoje você completa ${currentAge} ${currentAge === 1 ? 'ano' : 'anos'}! 🎉`,
    };
  }

  if (nextBirthday < today) {
    nextBirthday = new Date(currentYear + 1, birth.getMonth(), birth.getDate());
  }

  const nextAge = nextBirthday.getFullYear() - birth.getFullYear();
  const diffTime = nextBirthday.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const ageText = nextAge === 1 ? '1 ano' : `${nextAge} anos`;
  return {
    isToday: false,
    daysRemaining,
    nextAge,
    message: `Faltam ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'} para você completar ${ageText}.`,
  };
}

export function calculateUnlockDateFromAge(birthDateStr: string, targetAge: number): string {
  if (!birthDateStr) return '';
  const birth = parseDate(birthDateStr);
  const unlockYear = birth.getFullYear() + targetAge;
  const month = String(birth.getMonth() + 1).padStart(2, '0');
  const day = String(birth.getDate()).padStart(2, '0');
  return `${unlockYear}-${month}-${day}`;
}

export function getFifteenYearsCountdown(birthDateStr: string): {
  targetDateStr: string;
  isUnlocked: boolean;
  totalDaysRemaining: number;
  yearsRemaining: number;
  monthsRemaining: number;
  daysRemaining: number;
  progressPercentage: number;
  formattedTargetDate: string;
} {
  if (!birthDateStr) {
    return {
      targetDateStr: '',
      isUnlocked: false,
      totalDaysRemaining: 0,
      yearsRemaining: 15,
      monthsRemaining: 0,
      daysRemaining: 0,
      progressPercentage: 0,
      formattedTargetDate: '',
    };
  }

  const birth = parseDate(birthDateStr);
  const targetYear = birth.getFullYear() + 15;
  const target = new Date(targetYear, birth.getMonth(), birth.getDate());
  target.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDateStr = `${targetYear}-${String(birth.getMonth() + 1).padStart(2, '0')}-${String(birth.getDate()).padStart(2, '0')}`;
  const formattedTargetDate = formatDatePortuguese(targetDateStr);

  if (today >= target) {
    return {
      targetDateStr,
      isUnlocked: true,
      totalDaysRemaining: 0,
      yearsRemaining: 0,
      monthsRemaining: 0,
      daysRemaining: 0,
      progressPercentage: 100,
      formattedTargetDate,
    };
  }

  const birthTime = birth.getTime();
  const targetTime = target.getTime();
  const todayTime = today.getTime();

  const totalDuration = targetTime - birthTime;
  const elapsed = Math.max(0, todayTime - birthTime);
  const progressPercentage = totalDuration > 0
    ? Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)))
    : 0;

  const diffTime = targetTime - todayTime;
  const totalDaysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  // Calculate remaining years, months, days accurately
  let years = target.getFullYear() - today.getFullYear();
  let months = target.getMonth() - today.getMonth();
  let days = target.getDate() - today.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonthLastDay = new Date(target.getFullYear(), target.getMonth(), 0).getDate();
    days += prevMonthLastDay;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return {
    targetDateStr,
    isUnlocked: false,
    totalDaysRemaining,
    yearsRemaining: Math.max(0, years),
    monthsRemaining: Math.max(0, months),
    daysRemaining: Math.max(0, days),
    progressPercentage,
    formattedTargetDate,
  };
}

export function isItemUnlocked(unlockDateStr?: string): boolean {
  if (!unlockDateStr) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const unlock = parseDate(unlockDateStr);
  unlock.setHours(0, 0, 0, 0);
  return today >= unlock;
}

export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}
