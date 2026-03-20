const CATEGORY_COLORS: Record<string, { text: string; border: string }> = {
  "my research":     { text: "text-cat-my-research",    border: "border-l-cat-my-research" },
  "group research":  { text: "text-cat-group-research", border: "border-l-cat-group-research" },
  "my code":         { text: "text-cat-my-code",        border: "border-l-cat-my-code" },
  "group code":      { text: "text-cat-group-code",     border: "border-l-cat-group-code" },
  "my admin":        { text: "text-cat-my-admin",       border: "border-l-cat-my-admin" },
  "group admin":     { text: "text-cat-group-admin",    border: "border-l-cat-group-admin" },
  "coursework":        { text: "text-cat-coursework",      border: "border-l-cat-coursework" },
  "mentoring":         { text: "text-cat-mentoring",       border: "border-l-cat-mentoring" },
  "my meetings":       { text: "text-cat-my-meetings",     border: "border-l-cat-my-meetings" },
  "group meetings":    { text: "text-cat-group-meetings",  border: "border-l-cat-group-meetings" },
};

export const CATEGORIES = [
  "my research",
  "group research",
  "my code",
  "group code",
  "my admin",
  "group admin",
  "my meetings",
  "group meetings",
  "coursework",
  "mentoring",
];

export function getCategoryColor(category: string | null): string {
  if (!category) return "text-cat-default";
  return CATEGORY_COLORS[category.toLowerCase()]?.text || "text-cat-default";
}

export function getCategoryBorderColor(category: string | null): string {
  if (!category) return "border-l-border";
  return CATEGORY_COLORS[category.toLowerCase()]?.border || "border-l-cat-default";
}
