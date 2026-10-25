import { Component, type ReactNode } from "react";
import { FatalScreen } from "./fatal-screen";

interface State {
  error: Error | null;
}

/** Last line of defence: any unexpected React error shows an in-world fatal screen with reload. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("[fatal]", error);
  }

  render() {
    if (this.state.error) {
      return (
        <FatalScreen
          title="HỆ THỐNG SỤP ĐỔ"
          message="Giao diện gặp lỗi không lường trước. Tiến độ đã lưu vẫn còn."
          detail={[this.state.error.message]}
          action={{ label: "Tải lại", onClick: () => window.location.reload() }}
        />
      );
    }
    return this.props.children;
  }
}
