import * as React from "react";
import {
  Root as NavigationMenuPrimitive,
  List as NavigationMenuListPrimitive,
  Trigger as NavigationMenuTriggerPrimitive,
  Content as NavigationMenuContentPrimitive,
  Item as NavigationMenuItemPrimitive,
  Link as NavigationMenuLinkPrimitive,
  Indicator as NavigationMenuIndicatorPrimitive,
  Viewport as NavigationMenuViewportPrimitive,
} from "@radix-ui/react-navigation-menu";
import { ChevronDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";

// NavigationMenu
function NavigationMenu({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive>) {
  return (
    <NavigationMenuPrimitive
      data-slot="navigation-menu"
      className={cn(
        "mx-auto flex justify-center",
        className
      )}
      {...props}
    />
  );
}

// NavigationMenuList
function NavigationMenuList({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuListPrimitive>) {
  return (
    <NavigationMenuListPrimitive
      data-slot="navigation-menu-list"
      className={cn("group flex flex-1 list-none items-center gap-2", className)}
      {...props}
    />
  );
}

// NavigationMenuItem
function NavigationMenuItem({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuItemPrimitive>) {
  return (
    <NavigationMenuItemPrimitive
      data-slot="navigation-menu-item"
      className={cn("m-2", className)}
      {...props}
    />
  );
}

// NavigationMenuTrigger
function NavigationMenuTrigger({
  children,
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuTriggerPrimitive>) {
  return (
    <NavigationMenuTriggerPrimitive
      data-slot="navigation-menu-trigger"
      className={cn(
        "text-foreground hover:bg-accent hover:text-accent-foreground group inline-flex h-10 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium",
        "focus-ring",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDownIcon
        data-slot="navigation-menu-trigger-icon"
        className="relative top-px ml-2 size-4 transition duration-200 group-data-[state=open]:rotate-180"
      />
    </NavigationMenuTriggerPrimitive>
  );
}

// NavigationMenuContent
function NavigationMenuContent({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuContentPrimitive>) {
  return (
    <NavigationMenuContentPrimitive
      data-slot="navigation-menu-content"
      className={cn(
        "glass-surface p-6 text-popover-foreground",
        className
      )}
      {...props}
    />
  );
}

// NavigationMenuLink
function NavigationMenuLink({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuLinkPrimitive>) {
  return (
    <NavigationMenuLinkPrimitive
      data-slot="navigation-menu-link"
      className={cn(
        "text-foreground hover:bg-accent hover:text-accent-foreground block select-none rounded-md p-3 leading-none no-underline transition-colors",
        "focus-ring",
        className
      )}
      {...props}
    />
  );
}

// NavigationMenuIndicator
function NavigationMenuIndicator({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuIndicatorPrimitive>) {
  return (
    <NavigationMenuIndicatorPrimitive
      data-slot="navigation-menu-indicator"
      className={cn(
        "z-50 top-full flex h-1.5 items-end justify-center overflow-hidden",
        className
      )}
      {...props}
    >
      <div className="bg-border relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm" />
    </NavigationMenuIndicatorPrimitive>
  );
}

// NavigationMenuViewport
function NavigationMenuViewport({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuViewportPrimitive>) {
  return (
    <NavigationMenuViewportPrimitive
      data-slot="navigation-menu-viewport"
      className={cn(
        "glass-surface text-popover-foreground absolute left-0 top-full origin-[var(--radix-navigation-menu-viewport-transform-origin)] rounded-md border bg-popover p-4 shadow-lg",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "group-data-[state=open]:fade-in-80",
        className
      )}
      {...props}
    />
  );
}

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
};
