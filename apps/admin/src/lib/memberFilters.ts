import type { Member } from "@/types/admin";

/**
 * Consolidates the search-matching logic that used to be copy-pasted three
 * times in App.tsx (main directory search, slot-credit picker, issue-green-
 * card picker) into one predicate, reused by memberSearchPredicate below.
 */
export function memberMatchesQuery(m: Member, queryStr: string) {
  const query = queryStr.toLowerCase().trim();
  if (!query) return true;

  const cleanPhone = m.phone.replace(/[^0-9]/g, "");
  const cleanQuery = query.replace(/[^0-9]/g, "");

  return (
    m.full_name.toLowerCase().includes(query) ||
    m.email.toLowerCase().includes(query) ||
    (cleanQuery.length >= 3 && cleanPhone.includes(cleanQuery)) ||
    m.phone.toLowerCase().includes(query) ||
    m.member_id.toLowerCase().includes(query) ||
    m.referral_code.toLowerCase().includes(query)
  );
}

export type GreenCardFilter = "all" | "active" | "unpaid";

export function filterMemberPredicate(
  m: Member,
  queryStr: string,
  greenCardFilter: GreenCardFilter,
  programFilter: string,
) {
  if (!memberMatchesQuery(m, queryStr)) return false;

  if (greenCardFilter === "active" && !m.has_green_card) return false;
  if (greenCardFilter === "unpaid" && m.has_green_card) return false;

  if (programFilter === "has_slots") {
    return m.total_slots > 0;
  }
  if (programFilter === "no_slots") {
    return m.total_slots === 0;
  }
  if (programFilter !== "all") {
    return m.slots_by_program.some((prog) => prog.category.toLowerCase().includes(programFilter.toLowerCase()));
  }

  return true;
}

/** Tailwind classes for the program pill badges, keyed by program category. */
export function getProgramPillClass(category: string) {
  const cat = category.toLowerCase();
  if (cat.includes("mushroom")) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  if (cat.includes("potato")) return "bg-orange-500/10 text-orange-400 border-orange-500/20";
  if (cat.includes("ginger")) return "bg-lime-500/10 text-lime-400 border-lime-500/20";
  return "bg-primary/10 text-primary border-primary/20";
}

export function getProgramEmoji(category: string) {
  const cat = category.toLowerCase();
  if (cat.includes("mushroom")) return "🍄";
  if (cat.includes("potato")) return "🍠";
  if (cat.includes("ginger")) return "🌿";
  return "🌱";
}

export function memberInitial(member: Pick<Member, "full_name">) {
  return member.full_name.charAt(0).toUpperCase();
}
