import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Delete } from "lucide-react";

interface NumericKeypadProps {
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
}

export function NumericKeypad({ value, onChange, maxLength = 4 }: NumericKeypadProps) {
  const press = (n: string) => {
    if (n === "del") {
      onChange(value.slice(0, -1));
    } else if (value.length < maxLength) {
      onChange(value + n);
    }
  };

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      <div className="flex gap-3 justify-center">
        {Array.from({ length: maxLength }).map((_, i) => (
          <motion.div
            key={i}
            animate={{ scale: i < value.length ? [1, 1.4, 1] : 1 }}
            transition={{ duration: 0.3 }}
            className={`w-3.5 h-3.5 rounded-full border-2 transition-colors ${
              i < value.length ? "bg-brand-olive border-brand-olive" : "border-brand-sand bg-white/40"
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2.5 w-full max-w-[260px]">
        {["1","2","3","4","5","6","7","8","9"].map(n => (
          <KeypadButton key={n} onClick={() => press(n)}>
            {n}
          </KeypadButton>
        ))}
        <div />
        <KeypadButton onClick={() => press("0")} key="0">0</KeypadButton>
        <KeypadButton onClick={() => press("del")} ariaLabel="Effacer" key="del">
          <Delete className="w-5 h-5 text-brand-gold" />
        </KeypadButton>
      </div>
    </div>
  );
}

function KeypadButton({ children, onClick, ariaLabel }: { children: React.ReactNode; onClick: () => void; ariaLabel?: string; key?: React.Key }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      aria-label={ariaLabel}
      className="aspect-square rounded-2xl bg-white border border-brand-sand/70 text-brand-olive text-2xl font-bold cursor-pointer flex items-center justify-center shadow-sm hover:bg-brand-cream active:bg-brand-sand"
    >
      {children}
    </motion.button>
  );
}
