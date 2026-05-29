"use client";

import { motion } from "framer-motion";
import { clsx } from "clsx";
import { Bottle } from "./Bottle";
import type { Bottle as BottleType } from "@/types";

interface GameBoardProps {
  bottles: BottleType[];
  selectedBottle: number | null;
  pourFrom: number | null;
  pourTo: number | null;
  onBottleClick: (index: number) => void;
  isCompleted: boolean;
  isStuck: boolean;
}

export function GameBoard({
  bottles,
  selectedBottle,
  pourFrom,
  pourTo,
  onBottleClick,
  isCompleted,
  isStuck,
}: GameBoardProps) {
  // Split bottles into rows: up to 6 per row
  const bottlesPerRow = bottles.length <= 6 ? bottles.length : Math.ceil(bottles.length / 2);
  const rows: BottleType[][] = [];
  const indices: number[][] = [];

  for (let i = 0; i < bottles.length; i += bottlesPerRow) {
    rows.push(bottles.slice(i, i + bottlesPerRow));
    indices.push(
      Array.from({ length: Math.min(bottlesPerRow, bottles.length - i) }, (_, j) => i + j)
    );
  }

  return (
    <div className="flex flex-col items-center gap-8">
      {isStuck && !isCompleted && (
        <motion.div
          className="px-4 py-2 rounded-xl bg-danger-coral/20 border border-danger-coral/30 text-danger-coral text-sm font-medium"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          ⚠️ No valid moves — tap Restart
        </motion.div>
      )}

      {rows.map((row, rowIdx) => (
        <motion.div
          key={rowIdx}
          className={clsx(
            "flex items-end justify-center gap-3 sm:gap-4 flex-wrap"
          )}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: rowIdx * 0.05, duration: 0.4 }}
        >
          {row.map((bottle, localIdx) => {
            const globalIdx = indices[rowIdx][localIdx];
            return (
              <Bottle
                key={globalIdx}
                bottle={bottle}
                index={globalIdx}
                isSelected={selectedBottle === globalIdx}
                isPourSource={pourFrom === globalIdx}
                isPourTarget={pourTo === globalIdx}
                onClick={onBottleClick}
              />
            );
          })}
        </motion.div>
      ))}
    </div>
  );
}
