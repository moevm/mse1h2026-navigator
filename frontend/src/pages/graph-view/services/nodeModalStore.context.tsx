/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, type ReactNode } from "react";
import { NodeModalStore } from "./nodeModalStore";

const NodeModalStoreContext = createContext<NodeModalStore | null>(null);

export const NodeModalStoreProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [nodeModalStore] = useState(() => new NodeModalStore());

  return (
    <NodeModalStoreContext.Provider value={nodeModalStore}>
      {children}
    </NodeModalStoreContext.Provider>
  );
};

export const useNodeModalStore = () => {
  const context = useContext(NodeModalStoreContext);
  if (!context) {
    throw new Error(
      "useNodeModalStore must be used within NodeModalStoreProvider",
    );
  }

  return context;
};
