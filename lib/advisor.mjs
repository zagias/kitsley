import { projects } from './catalog.mjs';
// Replace this implementation with any model adapter that returns a validated project ID.
// The model never supplies products, prices, URLs, or priority scores.
export class RuleBasedAdvisor {
  async interpret(text) {
    const patterns = [['paint-cabinets',/paint.*(cabinet|cupboard)|(cabinet|cupboard).*paint|repaint/i],['cabinet-doors',/cabinet|cupboard|door/i],['bookcase',/bookcase|bookshelf/i],['shelves',/shelf|shelves/i],['workbench',/workbench|work bench/i],['refinish',/refinish|restore|furniture/i],['drawers',/drawer/i],['trim',/trim|moulding|molding|baseboard/i],['planter',/planter|garden box/i],['pegboard',/pegboard|tool storage/i]];
    // Door construction takes precedence over a mention of painting.
    if (/door/i.test(text) && /build|make|slab/i.test(text)) return 'cabinet-doors';
    return patterns.find(([,re])=>re.test(text))?.[0] ?? null;
  }
}
export const advisor = new RuleBasedAdvisor();
export function validateProjectId(id) { return projects.some(p=>p.id===id); }
