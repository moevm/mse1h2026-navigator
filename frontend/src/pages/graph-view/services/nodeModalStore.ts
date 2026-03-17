import { makeAutoObservable } from "mobx";
import type { Node } from "@xyflow/react";

export class NodeModalStore {
  private isOpen_ = false;
  private selectedNode_: Node | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  public get isOpen(): boolean {
    return this.isOpen_;
  }

  public get selectedNode(): Node | null {
    return this.selectedNode_;
  }

  public open = (node: Node): void => {
    this.selectedNode_ = node;
    this.isOpen_ = true;
  };

  public close = (): void => {
    this.isOpen_ = false;
  };
}
