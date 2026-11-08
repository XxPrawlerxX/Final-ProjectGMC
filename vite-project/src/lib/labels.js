export const CONDITION_LABEL = {
  "like-new": "Like new",
  good: "Good condition",
  fair: "Fair condition",
  "for-parts": "For parts / repair",
};

export const SELLER_TYPE_LABEL = {
  retail: "Retail business",
  wholesale: "Wholesale business",
  individual: "Individual seller",
};

// "carton" -> "cartons" when there is more than one
export const plural = (unit, count) => (count === 1 ? unit : unit === "kg" || unit === "set" ? unit : `${unit}s`);
