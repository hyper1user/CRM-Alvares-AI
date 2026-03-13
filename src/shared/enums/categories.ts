export enum ServiceType {
  Mobilized = 'мобілізований',
  Contract = 'контракт',
  Volunteer = 'доброволець',
  Conscript = 'строковик',
  Civilian = 'працівник'
}

export enum PersonnelStatus {
  Active = 'active',
  Excluded = 'excluded',
  Disposed = 'disposed'
}

export enum Gender {
  Male = 'ч',
  Female = 'ж'
}

export const BLOOD_TYPES = [
  'O(I) Rh+',
  'O(I) Rh-',
  'A(II) Rh+',
  'A(II) Rh-',
  'B(III) Rh+',
  'B(III) Rh-',
  'AB(IV) Rh+',
  'AB(IV) Rh-',
  'Невідомо'
] as const

export const CONTRACT_TYPES = [
  { name: '6 місяців', months: 6, toDemob: false },
  { name: '1 рік', months: 12, toDemob: false },
  { name: '18 місяців', months: 18, toDemob: false },
  { name: '2 роки', months: 24, toDemob: false },
  { name: '3 роки', months: 36, toDemob: false },
  { name: '5 років', months: 60, toDemob: false },
  { name: 'До демобілізації', months: 0, toDemob: true },
  { name: 'До кінця ВС', months: 0, toDemob: true },
  { name: 'До кінця ОВП', months: 0, toDemob: true },
  { name: 'Без контракту', months: 0, toDemob: false }
] as const

export const EDUCATION_LEVELS = [
  'Базова середня',
  'Повна загальна середня',
  'Професійно-технічна',
  'Фахова передвища',
  'Початковий рівень (короткий цикл)',
  'Бакалавр',
  'Магістр',
  'Доктор філософії',
  'Доктор наук'
] as const

export const ORDER_ISSUERS = [
  'Командир А0501',
  'Командир А1314',
  'Командир А0000',
  'ГК ЗСУ',
  'Командувач СВ',
  'Командувач ОТУ',
  'Начальник ГШ',
  'Міноборони'
] as const

export const MOVEMENT_ORDER_TYPES = [
  'Переміщення',
  'В розпорядження',
  'Прикомандирування',
  'Переведення',
  'Зарахування',
  'Виключення',
  'Відновлення'
] as const

export const EXCLUSION_REASONS = [
  'Звільнення з військової служби',
  'Переведення до іншої в/ч',
  'Загибель',
  'Зникнення безвісти',
  'Полон',
  'Дезертирство',
  'Смерть від хвороби',
  'Виключення за рішенням суду',
  'Інше'
] as const

export const ABSENCE_REASONS = [
  'Відпустка',
  'Відрядження',
  'Лікування',
  'Навчання',
  'Командирський збір',
  'Арешт',
  'СЗЧ (самовільне залишення)',
  'Виконання бойового завдання',
  'За розпорядженням',
  'Інше'
] as const

export const LOSS_TYPES = [
  'Загинув у бою',
  'Помер від поранень',
  'Зниклий безвісти',
  'Полон',
  'Помер від хвороби'
] as const

export const SUBDIVISIONS = [
  { code: 'Г-0', name: 'Управління', fullName: 'Управління батальйону', sortOrder: 0 },
  { code: 'Г-1', name: '10 ШР', fullName: '10 штурмова рота', sortOrder: 1 },
  { code: 'Г-2', name: '11 ШР', fullName: '11 штурмова рота', sortOrder: 2 },
  { code: 'Г-3', name: '12 ШР', fullName: '12 штурмова рота', sortOrder: 3 },
  { code: 'Г-4', name: '1 МБ', fullName: '1 мінометна батарея', sortOrder: 4 },
  { code: 'Г-5', name: '2 МБ', fullName: '2 мінометна батарея', sortOrder: 5 },
  { code: 'Г-6', name: 'ГРВ', fullName: 'Гранатометний розрахунково-вогневий взвод', sortOrder: 6 },
  { code: 'Г-7', name: 'ПТВ', fullName: 'Протитанковий взвод', sortOrder: 7 },
  { code: 'Г-8', name: 'ВПРК', fullName: 'Взвод протиракетних комплексів', sortOrder: 8 },
  { code: 'Г-9', name: 'КВ', fullName: 'Комунікаційний взвод', sortOrder: 9 },
  { code: 'Г-10', name: 'РБАК', fullName: 'Розвідувально-бойовий авіаційний комплекс', sortOrder: 10 },
  { code: 'Г-11', name: 'ЗРВ', fullName: 'Зенітний ракетний взвод', sortOrder: 11 },
  { code: 'Г-12', name: 'РВ', fullName: 'Розвідувальний взвод', sortOrder: 12 },
  { code: 'Г-13', name: 'ІСВ', fullName: 'Інженерно-саперний взвод', sortOrder: 13 },
  { code: 'Г-14', name: 'ВРБ', fullName: 'Взвод радіоелектронної боротьби', sortOrder: 14 },
  { code: 'Г-15', name: 'ВЗ', fullName: 'Взвод забезпечення', sortOrder: 15 },
  { code: 'Г-16', name: 'ВТЗ', fullName: 'Взвод технічного забезпечення', sortOrder: 16 },
  { code: 'Г-17', name: 'ВМЗ', fullName: 'Взвод матеріального забезпечення', sortOrder: 17 },
  { code: 'Г-18', name: 'МП', fullName: 'Медичний пункт', sortOrder: 18 },
  { code: 'К', name: 'РВП', fullName: 'Резерв військового поповнення', sortOrder: 19 },
  { code: 'РОЗП', name: 'Розпорядження', fullName: 'В розпорядженні командира', sortOrder: 20 }
] as const
