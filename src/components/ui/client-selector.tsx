import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Search, X, ChevronDown, ChevronRight, ChevronsUpDown, AlertTriangle, Check, Loader2 } from "lucide-react";
import { DropdownClient } from "@/hooks/useAllClientsDropdown";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ClientSelectorProps {
  clients: DropdownClient[];
  loading?: boolean;
  value: string;
  onValueChange: (id: string) => void;
  placeholder?: string;
}

interface GroupedClients {
  active: DropdownClient[];
  inactive: DropdownClient[];
  noSeo: DropdownClient[];
}

function groupClients(clients: DropdownClient[], selectedId: string): GroupedClients {
  const active: DropdownClient[] = [];
  const inactive: DropdownClient[] = [];
  const noSeo: DropdownClient[] = [];

  for (const c of clients) {
    const status = c.client_status.toLowerCase();
    if (status === "active") {
      if (!c.has_seo_service) {
        noSeo.push(c);
      } else {
        active.push(c);
      }
    } else {
      inactive.push(c);
    }
  }

  // Move selected client to top of its group
  const moveSelectedToTop = (arr: DropdownClient[]) => {
    const idx = arr.findIndex(c => c.id === selectedId);
    if (idx > 0) {
      const [item] = arr.splice(idx, 1);
      arr.unshift(item);
    }
    return arr;
  };

  return {
    active: moveSelectedToTop(active),
    inactive: moveSelectedToTop(inactive),
    noSeo: moveSelectedToTop(noSeo),
  };
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="bg-primary/20 text-primary font-semibold rounded-sm px-0.5">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}

function statusBadge(client: DropdownClient) {
  const status = client.client_status.toLowerCase();
  if (status === "active" && client.has_seo_service) {
    return <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 h-4 bg-success/15 text-success border-0 shrink-0">Active</Badge>;
  }
  if (status === "active" && !client.has_seo_service) {
    return <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 h-4 bg-warning/15 text-warning border-0 shrink-0">No SEO</Badge>;
  }
  return <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 h-4 bg-muted text-muted-foreground border-0 shrink-0 capitalize">{client.client_status}</Badge>;
}

export function ClientSelector({ clients, loading = false, value, onValueChange, placeholder = "Select client..." }: ClientSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeGroupOpen, setActiveGroupOpen] = useState(true);
  const [inactiveGroupOpen, setInactiveGroupOpen] = useState(false);
  const [noSeoGroupOpen, setNoSeoGroupOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce search — stable ref
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  // Filter clients
  const filtered = useMemo(() => {
    if (!debouncedSearch) return clients;
    const q = debouncedSearch.toLowerCase();
    return clients.filter(c =>
      c.contact_name.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.company_name && c.company_name.toLowerCase().includes(q))
    );
  }, [clients, debouncedSearch]);

  // Group with selected-client priority
  const grouped = useMemo(() => {
    const g = groupClients([...filtered], value);
    console.log("[Client Dropdown Groups]", { active: g.active.length, inactive: g.inactive.length, noSeo: g.noSeo.length });
    return g;
  }, [filtered, value]);

  // Flat list for keyboard nav
  const flatList = useMemo(() => {
    const list: DropdownClient[] = [];
    if (activeGroupOpen) list.push(...grouped.active);
    if (noSeoGroupOpen) list.push(...grouped.noSeo);
    if (inactiveGroupOpen) list.push(...grouped.inactive);
    return list;
  }, [grouped, activeGroupOpen, inactiveGroupOpen, noSeoGroupOpen]);

  const handleSelect = useCallback((client: DropdownClient) => {
    onValueChange(client.id);
    const status = client.client_status.toLowerCase();
    if (!client.has_seo_service && status === "active") {
      toast.warning("This client does not have an active SEO package.", { duration: 4000 });
    } else if (status !== "active") {
      toast.warning(`This client is currently "${client.client_status}".`, { duration: 4000 });
    }
    setOpen(false);
    setSearch("");
    setDebouncedSearch("");
    setFocusIndex(-1);
  }, [onValueChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusIndex(prev => Math.min(prev + 1, flatList.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && focusIndex >= 0 && focusIndex < flatList.length) {
      e.preventDefault();
      handleSelect(flatList[focusIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }, [flatList, focusIndex, handleSelect]);

  // Auto-expand groups when searching
  useEffect(() => {
    if (debouncedSearch) {
      setActiveGroupOpen(true);
      setInactiveGroupOpen(true);
      setNoSeoGroupOpen(true);
    } else {
      setActiveGroupOpen(true);
      setInactiveGroupOpen(false);
      setNoSeoGroupOpen(false);
    }
  }, [debouncedSearch]);

  // Focus search on open
  useEffect(() => {
    if (open) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
      setFocusIndex(-1);
    }
  }, [open]);

  // Scroll focused item into view
  useEffect(() => {
    if (focusIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[data-client-item]");
      items[focusIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [focusIndex]);

  const selectedClient = clients.find(c => c.id === value);
  const totalFiltered = filtered.length;

  const renderGroup = (
    title: string,
    items: DropdownClient[],
    isOpen: boolean,
    setIsOpen: (v: boolean) => void,
    startIndex: number
  ) => {
    if (items.length === 0) return null;
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex items-center gap-1.5 w-full px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
          {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          {title}
          <span className="ml-auto text-[10px] font-normal">({items.length})</span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {items.map((client, idx) => {
            const globalIdx = startIndex + idx;
            const isSelected = client.id === value;
            const isFocused = globalIdx === focusIndex;
            return (
              <button
                key={client.id}
                data-client-item
                onClick={() => handleSelect(client)}
                className={cn(
                  "flex items-center gap-2 w-full px-3 py-2 text-sm text-left rounded-lg transition-colors",
                  isFocused && "bg-accent",
                  isSelected && "bg-primary/10",
                  !isFocused && !isSelected && "hover:bg-muted/50"
                )}
              >
                {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                <div className={cn("flex flex-col min-w-0 flex-1", !isSelected && "ml-5")}>
                  <span className="truncate font-medium">
                    {highlightMatch(client.contact_name, debouncedSearch)}
                  </span>
                  {(client.company_name || client.email) && (
                    <span className="text-[11px] text-muted-foreground truncate">
                      {client.company_name && highlightMatch(client.company_name, debouncedSearch)}
                      {client.company_name && client.email && " · "}
                      {client.email && highlightMatch(client.email, debouncedSearch)}
                    </span>
                  )}
                </div>
                {statusBadge(client)}
              </button>
            );
          })}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-10 font-normal"
        >
          <span className="truncate">
            {selectedClient ? (
              <span className="flex items-center gap-2">
                {selectedClient.contact_name}
                {statusBadge(selectedClient)}
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        sideOffset={4}
        onKeyDown={handleKeyDown}
      >
        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            ref={searchInputRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or company..."
            className="border-0 h-8 px-0 shadow-none focus-visible:ring-0 text-sm"
          />
          {search && (
            <button
              onClick={() => { setSearch(""); setDebouncedSearch(""); }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Client list */}
        <ScrollArea className="max-h-[300px]">
          <div ref={listRef} className="p-1">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading clients...</span>
              </div>
            ) : clients.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <p className="text-sm">No clients found.<br />Please create a client first.</p>
              </div>
            ) : totalFiltered === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No clients match "{debouncedSearch}"
              </div>
            ) : (
              <>
                {renderGroup("Active Clients", grouped.active, activeGroupOpen, setActiveGroupOpen, 0)}
                {renderGroup("No SEO Package", grouped.noSeo, noSeoGroupOpen, setNoSeoGroupOpen,
                  activeGroupOpen ? grouped.active.length : 0
                )}
                {renderGroup("Inactive Clients", grouped.inactive, inactiveGroupOpen, setInactiveGroupOpen,
                  (activeGroupOpen ? grouped.active.length : 0) + (noSeoGroupOpen ? grouped.noSeo.length : 0)
                )}
              </>
            )}
          </div>
        </ScrollArea>

        {/* Footer count */}
        {!loading && totalFiltered > 0 && (
          <div className="border-t border-border px-3 py-1.5 text-[11px] text-muted-foreground">
            {totalFiltered} client{totalFiltered !== 1 ? "s" : ""} found
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
