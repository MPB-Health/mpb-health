import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

type MenuSection = {
  label: string;
  href: string;
  badge?: string;
  description?: string;
};

type MegaMenuProps = {
  title: string;
  items: MenuSection[];
  align?: "left" | "right";
};

export default function MegaMenu({ title, items, align = "left" }: MegaMenuProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
        btnRef.current?.focus();
      }
    };

    const onClickOutside = (e: MouseEvent) => {
      if (
        open &&
        panelRef.current &&
        btnRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClickOutside);

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClickOutside);
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const panel = panelRef.current;
    if (!panel) return;

    const links = Array.from(panel.querySelectorAll("a")) as HTMLAnchorElement[];

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        links[Math.min(index + 1, links.length - 1)]?.focus();
        break;
      case "ArrowUp":
        e.preventDefault();
        if (index === 0) {
          btnRef.current?.focus();
          setOpen(false);
        } else {
          links[Math.max(index - 1, 0)]?.focus();
        }
        break;
      case "Home":
        e.preventDefault();
        links[0]?.focus();
        break;
      case "End":
        e.preventDefault();
        links[links.length - 1]?.focus();
        break;
    }
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md transition-colors"
        aria-haspopup="true"
        aria-expanded={open}
      >
        {title}
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          ref={panelRef}
          role="menu"
          className={`absolute top-full mt-2 w-[min(44rem,90vw)] rounded-2xl border border-gray-200 bg-white/95 backdrop-blur-sm shadow-xl p-6 z-50 animate-in fade-in slide-in-from-top-2 duration-200
            ${align === "right" ? "right-0" : "left-0"}`}
        >
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 max-md:grid-cols-1">
            {items.map((item, i) => (
              <a
                key={i}
                href={item.href}
                className="group block rounded-lg px-3 py-2.5 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                role="menuitem"
                onKeyDown={(e) => handleKeyDown(e, i)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="ml-2 text-[11px] rounded-full bg-blue-50 text-blue-600 px-2 py-0.5 font-medium">
                      {item.badge}
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="mt-0.5 text-xs text-gray-500 group-hover:text-gray-600">
                    {item.description}
                  </p>
                )}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
