import { memo } from "react";
import type { FC } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ChevronRight } from "lucide-react";
import type { BasicFlowNode } from "../types/nodes";
import { SourceHandleTypes, TargetHandleTypes } from "../config/handleTypes";

export const BasicNode: FC<NodeProps<BasicFlowNode>> = memo(({ data }) => {
  return (
    <div
      className={`relative flex aspect-square min-h-28 w-32 cursor-pointer items-center justify-center rounded-md border p-3 text-center text-sm shadow-sm transition ${
        data.isCompleted
          ? "border-emerald-200 bg-emerald-50 text-emerald-950"
          : data.isRequired
            ? "border-slate-300 bg-white text-slate-900"
            : "border-slate-200 bg-slate-50 text-slate-700"
      }`}
    >
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

      <div className="max-w-full break-words px-1 leading-tight">
        <p>{data.title}</p>
        <p className="mt-1 text-[10px] text-slate-500">{data.learnHours} ч</p>
      </div>

      {data.isCollapsed && data.hiddenDescendantsCount ? (
        <span className="absolute bottom-2 right-2 inline-flex h-6 min-w-6 items-center justify-center gap-0.5 rounded-md bg-slate-900 px-1.5 text-[11px] font-semibold text-white shadow-sm">
          <ChevronRight className="size-3" />
          {data.hiddenDescendantsCount}
        </span>
      ) : null}
    </div>
  );
});
