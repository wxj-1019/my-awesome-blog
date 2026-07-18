"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

interface SheetContextProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  side: 'top' | 'right' | 'bottom' | 'left';
}

const SheetContext = React.createContext<SheetContextProps | null>(null);

const Sheet = ({ children, defaultOpen = false, open: controlledOpen, onOpenChange }: { children: React.ReactNode, defaultOpen?: boolean, open?: boolean, onOpenChange?: (open: boolean) => void }) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  
  const open = controlledOpen ?? isOpen;
  const setOpen = onOpenChange ? (newOpen: boolean) => onOpenChange(newOpen) : setIsOpen;
  
  return (
    <SheetContext.Provider value={{ open, setOpen, side: 'right' }}>
      {children}
    </SheetContext.Provider>
  );
};

interface SheetTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

const SheetTrigger = React.forwardRef<HTMLDivElement, SheetTriggerProps>(
  ({ children, asChild = false, ...props }, ref) => {
    const context = React.useContext(SheetContext);
    
    if (!context) {
      return null;
    }
    
    const { setOpen } = context;
    
    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{ onClick?: (e: React.MouseEvent<unknown>) => void }>;
      return React.cloneElement(child, {
        onClick: (e: React.MouseEvent<unknown>) => {
          child.props.onClick?.(e);
          setOpen(true);
        },
      });
    }
    
    return (
      <div ref={ref} onClick={() => setOpen(true)} {...props}>
        {React.cloneElement(children as React.ReactElement, { onClick: () => setOpen(true) })}
      </div>
    );
  }
);

SheetTrigger.displayName = 'SheetTrigger';

interface SheetCloseProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

const SheetClose = React.forwardRef<HTMLDivElement, SheetCloseProps>(
  ({ children, asChild = false, ...props }, ref) => {
    const context = React.useContext(SheetContext);
    
    if (!context) {
      return null;
    }
    
    const { setOpen } = context;
    
    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{ onClick?: (e: React.MouseEvent<unknown>) => void }>;
      return React.cloneElement(child, {
        onClick: (e: React.MouseEvent<unknown>) => {
          child.props.onClick?.(e);
          setOpen(false);
        },
      });
    }
    
    return (
      <div ref={ref} onClick={() => setOpen(false)} {...props}>
        {React.cloneElement(children as React.ReactElement, { onClick: () => setOpen(false) })}
      </div>
    );
  }
);

SheetClose.displayName = 'SheetClose';

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-glass backdrop-blur-xl border border-glass-border p-6 shadow-lg text-white",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 h-auto rounded-b-lg border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 h-auto rounded-t-lg border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
);

interface SheetContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sheetVariants> {
  side?: 'top' | 'right' | 'bottom' | 'left';
}

const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ side = 'right', className, children, ...props }, ref) => {
    const context = React.useContext(SheetContext);
    
    if (!context) {
      return null;
    }
    
    const { open, setOpen } = context;
    
    if (!open) {
      return null;
    }
    
    return (
      <>
        <div className="fixed inset-0 z-40 backdrop-blur-sm" onClick={() => setOpen(false)} style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }} />
        <div
          ref={ref}
          className={cn(
            sheetVariants({ side }),
            className
          )}
          {...props}
        >
          {children}
          <button
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary"
            onClick={() => setOpen(false)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>
      </>
    );
  }
);
SheetContent.displayName = "SheetContent";

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
);
SheetHeader.displayName = "SheetHeader";

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
);
SheetFooter.displayName = "SheetFooter";

const SheetTitle = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("text-lg font-semibold text-white", className)}
    {...props}
  />
);
SheetTitle.displayName = "SheetTitle";

const SheetDescription = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("text-sm text-gray-400", className)}
    {...props}
  />
);
SheetDescription.displayName = "SheetDescription";

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
