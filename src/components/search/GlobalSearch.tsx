import { useState, useEffect, useRef } from "react";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { Input } from "@/components/ui/input";
import { Search, Users, Building2, Calendar, X, MessageSquare, Target, FolderKanban, Ticket } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function GlobalSearch() {
  const { results, loading, search, clear } = useGlobalSearch();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const debounce = setTimeout(() => search(query), 300);
    return () => clearTimeout(debounce);
  }, [query, search]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const iconForType = (type: string) => {
    switch (type) {
      case "user": return Users;
      case "business": return Building2;
      case "event": return Calendar;
      case "inquiry": return MessageSquare;
      case "lead": return Target;
      case "deal": return FolderKanban;
      default: return Search;
    }
  };

  const handleSelect = (result: { type: string; id: string }) => {
    setOpen(false);
    setQuery("");
    clear();
    switch (result.type) {
      case "user": navigate("/users"); break;
      case "business": navigate("/businesses"); break;
      case "event": navigate("/calendar"); break;
      case "inquiry": navigate("/inquiries"); break;
      case "lead": navigate("/leads"); break;
      case "deal": navigate("/deals"); break;
    }
  };

  return (
    <div ref={ref} className="relative hidden sm:block">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder="Search..."
          className="pl-9 pr-8 h-9 w-64 bg-muted text-sm"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); clear(); setOpen(false); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && (query.length >= 2) && (
        <div className="absolute top-full mt-1 left-0 w-80 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {loading ? (
            <div className="py-4 text-center text-sm text-muted-foreground">Searching…</div>
          ) : results.length === 0 ? (
            <div className="py-4 text-center text-sm text-muted-foreground">No results found</div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {results.map((r) => {
                const Icon = iconForType(r.type);
                return (
                  <button
                    key={`${r.type}-${r.id}`}
                    onClick={() => handleSelect(r)}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-muted/50 transition-colors"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground uppercase ml-auto shrink-0">
                      {r.type}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
