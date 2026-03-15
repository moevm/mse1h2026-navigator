/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, type ReactNode } from "react";
import { GraphStore } from "./graphStore";

const GraphStoreContext = createContext<GraphStore | null>(null);

export const GraphStoreProvider = ({ children }: { children: ReactNode }) => {
  const [graphStore] = useState(() => new GraphStore());

  return (
    <GraphStoreContext.Provider value={graphStore}>
      {children}
    </GraphStoreContext.Provider>
  );
};

export const useGraphStore = () => {
  const context = useContext(GraphStoreContext);
  if (!context) {
    throw new Error("useGraphStore must be used within GraphStoreProvider");
  }
  return context;
};
