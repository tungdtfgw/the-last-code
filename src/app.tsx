import { useMemo } from "react";
import { getDefaultRegistry } from "./game/level-registry";
import { createRepository } from "./storage/create-repository";
import { ErrorBoundary } from "./ui/error-boundary";
import { FatalScreen } from "./ui/fatal-screen";
import { GameScreen } from "./ui/game-screen";

const LEVEL_ID = "1.4";

function LevelRoute() {
  const registry = getDefaultRegistry();
  const level = registry.getLevel(LEVEL_ID);
  const repository = useMemo(() => createRepository(), []);
  if (!level) {
    const errors = Object.values(registry.invalid).flat();
    return (
      <FatalScreen
        title="DỮ LIỆU LEVEL HỎNG"
        message={`Không đọc được dữ liệu level ${LEVEL_ID}.`}
        detail={errors.slice(0, 8)}
        action={{ label: "Tải lại", onClick: () => window.location.reload() }}
      />
    );
  }
  return <GameScreen level={level} repository={repository} />;
}

export function App() {
  return (
    <ErrorBoundary>
      <LevelRoute />
    </ErrorBoundary>
  );
}
