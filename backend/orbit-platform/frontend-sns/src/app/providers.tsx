"use client";

import { Provider } from "react-redux";
import { store } from "@/store/redux/store";
import type { ReactNode } from "react";

type Props = { children: ReactNode };

export default function Providers({ children }: Props) {
  return <Provider store={store}>{children}</Provider>;
}
