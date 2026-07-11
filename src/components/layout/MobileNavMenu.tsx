"use client";

import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@/i18n/navigation";

interface MobileNavMenuProps {
  items: { href: string; label: string }[];
  menuLabel: string;
}

export function MobileNavMenu({ items, menuLabel }: MobileNavMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" aria-label={menuLabel} className="sm:hidden">
            <Menu className="h-4 w-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        {items.map((item) => (
          <DropdownMenuItem key={item.href} render={<Link href={item.href}>{item.label}</Link>} />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
