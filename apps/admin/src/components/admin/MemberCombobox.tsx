import { useState, type ReactNode } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import type { Member } from "@/types/admin";

interface MemberComboboxProps {
  members: Member[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  renderBadge?: (member: Member) => ReactNode;
}

/**
 * Shared searchable member picker — replaces the three hand-rolled
 * filter-dropdown implementations that used to live in App.tsx (slot
 * crediting, issue green card, and the dashboard member search).
 */
export function MemberCombobox({ members, value, onChange, placeholder, renderBadge }: MemberComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = members.find((m) => m.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-auto w-full justify-between px-3 py-2 font-normal"
        >
          {selected ? (
            <span className="flex min-w-0 items-center gap-2 text-left">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                {selected.full_name.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-foreground">{selected.full_name}</span>
                <span className="block truncate text-xs text-muted-foreground">{selected.email}</span>
              </span>
            </span>
          ) : (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Search className="h-4 w-4" /> {placeholder || "Search member..."}
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Type name, email, phone, or ID..." />
          <CommandList>
            <CommandEmpty>No members found.</CommandEmpty>
            <CommandGroup>
              {members.map((m) => (
                <CommandItem
                  key={m.id}
                  value={`${m.full_name} ${m.email} ${m.phone} ${m.member_id}`}
                  onSelect={() => {
                    onChange(m.id);
                    setOpen(false);
                  }}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Check className={cn("h-4 w-4 shrink-0", value === m.id ? "opacity-100" : "opacity-0")} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm">{m.full_name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{m.email}</span>
                    </span>
                  </span>
                  {renderBadge?.(m)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
