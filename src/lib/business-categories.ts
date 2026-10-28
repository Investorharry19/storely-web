export const BUSINESS_CATEGORIES = [
  "Fashion & apparel",
  "Beauty & personal care",
  "Food & beverage",
  "Home & living",
  "Electronics & technology",
  "Health & wellness",
  "Arts & crafts",
  "Professional services",
  "Education & training",
  "Events & entertainment",
  "Travel & hospitality",
  "Other",
] as const;

export type BusinessCategory = (typeof BUSINESS_CATEGORIES)[number];
