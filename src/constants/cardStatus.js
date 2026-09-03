export const CARD_STATUS_OPTIONS = [
  { value: 'new', label: 'Từ mới' },
  { value: 'active', label: 'Đang học' },
  { value: 'learning', label: 'Cần nhai lại' },
  { value: 'mastered', label: 'Đã thuộc' },
];

export const CARD_STATUS_LABELS = Object.fromEntries(
  CARD_STATUS_OPTIONS.map((option) => [option.value, option.label]),
);
