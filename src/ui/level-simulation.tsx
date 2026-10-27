import type { ComponentProps } from "react";
import { BASE_TYPES, simulationOf, type LevelDefinition } from "../game/level-types";
import { typeTitle } from "../game/type-gloss";
import { FenceSimulation } from "./fence-simulation";
import { KioskSimulation } from "./kiosk-simulation";
import { RelaySimulation } from "./relay-simulation";
import { ScannerSimulation } from "./scanner-simulation";
import { SorterSimulation } from "./sorter-simulation";

export type SimulationProps = ComponentProps<typeof ScannerSimulation>;

/** Legend of the simulation panel header: type colours for scenes that sort by type, nothing for the others. */
export function SimulationLegend({ level }: { level: LevelDefinition }) {
  const kind = simulationOf(level).kind;
  if (kind !== "scanner" && kind !== "sorter") return null;
  return (
    <>
      {BASE_TYPES.map((t) => (
        <i key={t} className="legend" style={{ ["--chip" as string]: `var(--type-${t})` }} title={typeTitle(t)}>
          {t}
        </i>
      ))}
    </>
  );
}

/**
 * Picks the simulation for a level from `simulation.kind` (missing: scanner).
 * A new kind adds its timeline + scene and one branch here, keeping `SimulationProps`.
 */
export function LevelSimulation(props: SimulationProps) {
  switch (simulationOf(props.level).kind) {
    case "relay":
      return <RelaySimulation {...props} />;
    case "kiosk":
      return <KioskSimulation {...props} />;
    case "sorter":
      return <SorterSimulation {...props} />;
    case "fence":
      return <FenceSimulation {...props} />;
    case "scanner":
      return <ScannerSimulation {...props} />;
  }
}
