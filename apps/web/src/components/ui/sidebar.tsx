import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { VariantProps, cva } from 'class-variance-authority';
import { PanelLeft } from 'lucide-react';

import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const SIDEBAR_COOKIE_NAME = 'sidebar_state';
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = '16rem';
const SIDEBAR_WIDTH_MOBILE = '18rem';
const SIDEBAR_WIDTH_ICON = '3rem';
const SIDEBAR_KEYBOARD_SHORTCUT = 'b';

type SidebarContextProps = {
  state: 'expanded' | 'collapsed';
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextProps | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider.');
  }

  return context;
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }
>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      className,
      style,
      children,
      ...props
    },
    ref,
  ) => {
    const isMobile = useIsMobile();
    const [openMobile, setOpenMobile] = React.useState(false);

    // This is the internal state of the sidebar.
    // We use openProp and setOpenProp for control from outside the component.
    const [_open, _setOpen] = React.useState(defaultOpen);
    const open = openProp ?? _open;
    const setOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === 'function' ? value(open) : value;
        if (setOpenProp) {
          setOpenProp(openState);
        } else {
          _setOpen(openState);
        }

        // This sets the cookie to keep the sidebar state.
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
      },
      [setOpenProp, open],
    );

    // Helper to toggle the sidebar.
    const toggleSidebar = React.useCallback(() => {
      return isMobile
        ? setOpenMobile((open) => !open)
        : setOpen((open) => !open);
    }, [isMobile, setOpen, setOpenMobile]);

    // Adds a keyboard shortcut to toggle the sidebar.
    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault();
          toggleSidebar();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleSidebar]);

    // We add a state so that we can do data-state="expanded" or "collapsed".
    // This makes it easier to style the sidebar with Tailwind classes.
    const state = open ? 'expanded' : 'collapsed';

    const contextValue = React.useMemo<SidebarContextProps>(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }),
      [
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      ],
    );

    return (
      <SidebarContext.Provider value={contextValue}>
        <TooltipProvider delayDuration={0}>
          <div
            style={
              {
                '--sidebar-width': SIDEBAR_WIDTH,
                '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
                ...style,
              } as React.CSSProperties
            }
            className={cn(
              'group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar',
              className,
            )}
            ref={ref}
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    );
  },
);
SidebarProvider.displayName = 'SidebarProvider';

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    side?: 'left' | 'right';
    variant?: 'sidebar' | 'floating' | 'inset';
    collapsible?: 'offcanvas' | 'icon' | 'none';
  }
>(
  (
    {
      side = 'left',
      variant = 'sidebar',
      collapsible = 'offcanvas',
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

    if (collapsible === 'none') {
      return (
        <div
          className={cn(
            'flex h-full w-[--sidebar-width] flex-col bg-sidebar text-sidebar-foreground',
            className,
          )}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      );
    }

    if (isMobile) {
      return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
          <SheetContent
            data-sidebar="sidebar"
            data-mobile="true"
            className="w-[--sidebar-width] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
            style={
              {
                '--sidebar-width': SIDEBAR_WIDTH_MOBILE,
              } as React.CSSProperties
            }
            side={side}
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Sidebar</SheetTitle>
              <SheetDescription>Displays the mobile sidebar.</SheetDescription>
            </SheetHeader>
            <div className="flex h-full w-full flex-col">{children}</div>
          </SheetContent>
        </Sheet>
      );
    }

    return (
      <div
        ref={ref}
        className="group peer hidden text-sidebar-foreground md:block"
        data-state={state}
        data-collapsible={state === 'collapsed' ? collapsible : ''}
        data-variant={variant}
        data-side={side}
      >
        {/* This is what handles the sidebar gap on desktop */}
        <div
          className={cn(
            'relative w-[--sidebar-width] bg-transparent transition-[width] duration-200 ease-linear',
            'group-data-[collapsible=offcanvas]:w-0',
            'group-data-[side=right]:rotate-180',
            variant === 'floating' || variant === 'inset'
              ? 'group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]'
              : 'group-data-[collapsible=icon]:w-[--sidebar-width-icon]',
          )}
        />
        <div
          className={cn(
            'fixed inset-y-0 z-10 hidden h-svh w-[--sidebar-width] transition-[left,right,width] duration-200 ease-linear md:flex',
            side === 'left'
              ? 'left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]'
              : 'right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]',
            // Adjust the padding for floating and inset variants.
            variant === 'floating' || variant === 'inset'
              ? cn(
                  'border-border shadow-lg',
                  side === 'left' ? 'border-r' : 'border-l',
                  collapsible === 'icon' &&
                    'group-data-[state=collapsed]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))] group-data-[state=collapsed]:border-transparent group-data-[state=collapsed]:shadow-none',
                  collapsible === 'icon' &&
                    variant === 'floating' &&
                    'group-data-[state=expanded]:m-2 group-data-[state=expanded]:rounded-xl',
                  collapsible === 'icon' &&
                    variant === 'inset' &&
                    'group-data-[state=expanded]:ml-2 group-data-[state=expanded]:mt-2 group-data-[state=expanded]:h-[calc(100svh_-_theme(spacing.4))] group-data-[state=expanded]:rounded-xl',
                )
              : cn(
                  'border-border bg-sidebar',
                  side === 'left' ? 'border-r' : 'border-l',
                  collapsible === 'icon' &&
                    'group-data-[state=collapsed]:w-[--sidebar-width-icon]',
                ),
            collapsible === 'icon' &&
              'group-data-[state=collapsed]:bg-transparent',
            className,
          )}
        >
          <div className="flex h-full w-full flex-col">{children}</div>
        </div>
      </div>
    );
  },
);
Sidebar.displayName = 'Sidebar';

const sidebarTriggerVariants = cva(
  'group absolute right-0 top-1/2 z-20 hidden -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-background p-0 text-foreground opacity-0 transition-opacity duration-200 ease-linear hover:bg-background/90 group-hover/sidebar-wrapper:opacity-100 md:flex',
  {
    variants: {
      side: {
        left: '',
        right: 'left-0 -translate-x-1/2 rotate-180',
      },
      variant: {
        sidebar: '',
        floating:
          'group-data-[collapsible=icon]:group-data-[state=expanded]:right-[calc(theme(spacing.2)*-1)] group-data-[collapsible=icon]:group-data-[state=expanded]:top-[calc(theme(spacing.2)*-1)] group-data-[collapsible=icon]:group-data-[state=expanded]:rounded-tr-none group-data-[collapsible=icon]:group-data-[state=expanded]:border group-data-[collapsible=icon]:group-data-[state=expanded]:border-border group-data-[collapsible=icon]:group-data-[state=expanded]:bg-primary group-data-[collapsible=icon]:group-data-[state=expanded]:p-1 group-data-[collapsible=icon]:group-data-[state=expanded]:text-primary-foreground',
        inset:
          'group-data-[collapsible=icon]:group-data-[state=expanded]:right-[calc(theme(spacing.2)*-1)] group-data-[collapsible=icon]:group-data-[state=expanded]:top-[calc(theme(spacing.2)*-1)] group-data-[collapsible=icon]:group-data-[state=expanded]:rounded-tr-none group-data-[collapsible=icon]:group-data-[state=expanded]:border group-data-[collapsible=icon]:group-data-[state=expanded]:border-border group-data-[collapsible=icon]:group-data-[state=expanded]:bg-primary group-data-[collapsible=icon]:group-data-[state=expanded]:p-1 group-data-[collapsible=icon]:group-data-[state=expanded]:text-primary-foreground',
      },
    },
    defaultVariants: {
      side: 'left',
      variant: 'sidebar',
    },
  },
);

const SidebarTrigger = React.forwardRef<
  React.ComponentProps<typeof Button>,
  VariantProps<typeof sidebarTriggerVariants> & {
    asChild?: boolean;
  }
>(({ className, side, variant, asChild, ...props }, ref) => {
  const { isMobile, toggleSidebar } = useSidebar();
  const Comp = asChild ? Slot : Button;

  if (isMobile) {
    return (
      <Comp
        ref={ref}
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className={cn('md:hidden', className)}
        {...props}
      >
        <PanelLeft />
      </Comp>
    );
  }

  return (
    <Comp
      ref={ref}
      variant="ghost"
      size="icon"
      className={cn(sidebarTriggerVariants({ side, variant }), className)}
      onClick={toggleSidebar}
      {...props}
    />
  );
});
SidebarTrigger.displayName = 'SidebarTrigger';

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { state } = useSidebar();

  return (
    <div
      ref={ref}
      className={cn(
        'flex h-[var(--header-height)] items-center gap-2 border-b px-3 py-2',
        state === 'collapsed' && 'h-auto justify-center border-b-0 p-2',
        className,
      )}
      {...props}
    />
  );
});
SidebarHeader.displayName = 'SidebarHeader';

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { state } = useSidebar();

  return (
    <div
      ref={ref}
      className={cn(
        'flex-1 overflow-y-auto overflow-x-hidden px-3 py-2',
        state === 'collapsed' && 'px-0.5 py-2',
        className,
      )}
      {...props}
    />
  );
});
SidebarContent.displayName = 'SidebarContent';

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { state } = useSidebar();

  return (
    <div
      ref={ref}
      className={cn(
        'mt-auto flex h-[var(--header-height)] items-center gap-2 border-t px-3 py-2',
        state === 'collapsed' && 'h-auto justify-center border-t-0 p-2',
        className,
      )}
      {...props}
    />
  );
});
SidebarFooter.displayName = 'SidebarFooter';

const SidebarTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { state } = useSidebar();

  if (state === 'collapsed') {
    return null;
  }

  return (
    <p
      ref={ref}
      className={cn(
        'line-clamp-1 text-lg font-semibold tracking-tight text-foreground',
        className,
      )}
      {...props}
    />
  );
});
SidebarTitle.displayName = 'SidebarTitle';

const SidebarSeparator = React.forwardRef<
  React.ElementRef<typeof Separator>,
  React.ComponentProps<typeof Separator>
>(({ className, ...props }, ref) => {
  const { state } = useSidebar();

  if (state === 'collapsed') {
    return <Separator ref={ref} className={cn('my-2', className)} {...props} />;
  }

  return (
    <div ref={ref} className={cn('my-2 flex items-center gap-2', className)}>
      <Separator className="shrink" {...props} />
      <p className="grow-0 text-xs text-muted-foreground">Menu</p>
      <Separator className="shrink" {...props} />
    </div>
  );
});
SidebarSeparator.displayName = 'SidebarSeparator';

const SidebarLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentProps<'a'> & {
    icon?: React.ReactNode;
    label?: string;
    active?: boolean;
    disabled?: boolean;
    tooltip?: string;
  }
>(
  (
    { className, icon, label, active, disabled, tooltip, children, ...props },
    ref,
  ) => {
    const { state } = useSidebar();

    if (state === 'collapsed') {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              ref={ref}
              className={cn(
                'flex items-center justify-center gap-2 rounded-md p-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
                active && 'bg-accent text-accent-foreground',
                disabled && 'pointer-events-none opacity-50',
                className,
              )}
              {...props}
            >
              {icon &&
                React.cloneElement(icon as React.ReactElement, {
                  className: 'size-5',
                })}
              <span className="sr-only">{label ?? children}</span>
            </a>
          </TooltipTrigger>
          {(tooltip ?? label ?? children) && (
            <TooltipContent side="right">
              {tooltip ?? label ?? children}
            </TooltipContent>
          )}
        </Tooltip>
      );
    }

    return (
      <a
        ref={ref}
        className={cn(
          'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
          active && 'bg-accent text-accent-foreground',
          disabled && 'pointer-events-none opacity-50',
          className,
        )}
        {...props}
      >
        {icon &&
          React.cloneElement(icon as React.ReactElement, {
            className: 'size-5',
          })}
        {label ?? children}
      </a>
    );
  },
);
SidebarLink.displayName = 'SidebarLink';

const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    responsive?: boolean;
  }
>(({ className, responsive = true, ...props }, ref) => {
  const { state } = useSidebar();

  return (
    <div
      ref={ref}
      className={cn(
        'flex-1 transition-[margin-left,margin-right] duration-200 ease-linear',
        responsive &&
          'md:data-[state=expanded]:ml-[var(--sidebar-width)] md:data-[state=expanded]:data-[side=right]:mr-[var(--sidebar-width)] md:data-[state=expanded]:data-[side=right]:ml-0',
        responsive &&
          'md:data-[state=collapsed]:data-[collapsible=icon]:ml-[var(--sidebar-width-icon)] md:data-[state=collapsed]:data-[collapsible=icon]:data-[side=right]:mr-[var(--sidebar-width-icon)] md:data-[state=collapsed]:data-[collapsible=icon]:data-[side=right]:ml-0',
        responsive &&
          'md:data-[state=collapsed]:data-[collapsible=offcanvas]:ml-0 md:data-[state=collapsed]:data-[collapsible=offcanvas]:data-[side=right]:mr-0',
        responsive &&
          'md:data-[variant=floating]:data-[state=expanded]:ml-[calc(var(--sidebar-width)_+_theme(spacing.4))] md:data-[variant=floating]:data-[state=expanded]:data-[side=right]:mr-[calc(var(--sidebar-width)_+_theme(spacing.4))] md:data-[variant=floating]:data-[state=expanded]:data-[side=right]:ml-0',
        responsive &&
          'md:data-[variant=floating]:data-[state=collapsed]:data-[collapsible=icon]:ml-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))] md:data-[variant=floating]:data-[state=collapsed]:data-[collapsible=icon]:data-[side=right]:mr-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))] md:data-[variant=floating]:data-[state=collapsed]:data-[collapsible=icon]:data-[side=right]:ml-0',
        responsive &&
          'md:data-[variant=inset]:data-[state=expanded]:ml-[calc(var(--sidebar-width)_+_theme(spacing.4))] md:data-[variant=inset]:data-[state=expanded]:data-[side=right]:mr-[calc(var(--sidebar-width)_+_theme(spacing.4))] md:data-[variant=inset]:data-[state=expanded]:data-[side=right]:ml-0',
        responsive &&
          'md:data-[variant=inset]:data-[state=collapsed]:data-[collapsible=icon]:ml-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))] md:data-[variant=inset]:data-[state=collapsed]:data-[collapsible=icon]:data-[side=right]:mr-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))] md:data-[variant=inset]:data-[state=collapsed]:data-[collapsible=icon]:data-[side=right]:ml-0',
        className,
      )}
      {...props}
    />
  );
});
SidebarInset.displayName = 'SidebarInset';

const SidebarSearch = React.forwardRef<
  React.ComponentProps<typeof Input>,
  React.ComponentProps<typeof Input>
>(({ className, ...props }, ref) => {
  const { state } = useSidebar();

  if (state === 'collapsed') {
    return null;
  }

  return (
    <Input
      ref={ref}
      className={cn('h-9 rounded-md', className)}
      placeholder="Search..."
      {...props}
    />
  );
});
SidebarSearch.displayName = 'SidebarSearch';

const SidebarSkeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { state } = useSidebar();

  if (state === 'collapsed') {
    return (
      <div
        ref={ref}
        className={cn('flex flex-col items-center gap-2 p-2', className)}
        {...props}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="size-8 rounded-lg" />
        ))}
      </div>
    );
  }
  return (
    <div
      ref={ref}
      className={cn('flex flex-col gap-2 p-3', className)}
      {...props}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="grid gap-1">
          <Skeleton className="h-5 w-20 rounded-lg" />
          <Skeleton className="h-4 w-24 rounded-lg" />
        </div>
      ))}
    </div>
  );
});
SidebarSkeleton.displayName = 'SidebarSkeleton';

export {
  Sidebar,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTitle,
  SidebarSeparator,
  SidebarLink,
  SidebarInset,
  SidebarSearch,
  SidebarSkeleton,
  useSidebar,
};
