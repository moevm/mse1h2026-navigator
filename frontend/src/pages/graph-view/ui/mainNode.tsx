import { memo } from "react";
import type { FC } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { MainFlowNode } from "../types/nodes";
import { SourceHandleTypes, TargetHandleTypes } from "../config/handleTypes";

export const MainNode: FC<NodeProps<MainFlowNode>> = memo(({ data }) => {
  return (
    <div className="flex aspect-square min-h-32 w-36 items-center justify-center rounded-md border border-slate-900 bg-slate-900 p-3 text-center text-sm text-white shadow-md">
      <Handle
        id={SourceHandleTypes.TOP_SOURCE}
        type="source"
        position={Position.Top}
      />
      <Handle
        id={SourceHandleTypes.BOTTOM_SOURCE}
        type="source"
        position={Position.Bottom}
      />
      <Handle
        id={SourceHandleTypes.LEFT_SOURCE}
        type="source"
        position={Position.Left}
      />
      <Handle
        id={SourceHandleTypes.RIGHT_SOURCE}
        type="source"
        position={Position.Right}
      />

      <Handle
        id={TargetHandleTypes.TOP_TARGET}
        type="target"
        position={Position.Top}
      />
      <Handle
        id={TargetHandleTypes.BOTTOM_TARGET}
        type="target"
        position={Position.Bottom}
      />
      <Handle
        id={TargetHandleTypes.LEFT_TARGET}
        type="target"
        position={Position.Left}
      />
      <Handle
        id={TargetHandleTypes.RIGHT_TARGET}
        type="target"
        position={Position.Right}
      />

      <div className="max-w-full break-words px-1 font-semibold leading-tight">
        {data.title}
      </div>
    </div>
  );
});
