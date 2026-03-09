import { memo } from "react";
import type { FC } from "react";
import type { BasicNode as PropsType } from "../types/nodes";
import { Handle, Position } from "@xyflow/react";

export const BasicNode: FC<PropsType> = memo(({ data }) => {
  return (
    <div className="bg-white rounded-full p-2 aspect-square flex items-center justify-center">
      {/* входящие */}
      <Handle type="target" position={Position.Top} />
      <Handle type="target" position={Position.Left} />

      {/* исходящие */}
      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Right} />

      <div className="text-center break-words px-2 max-w-30">
        {data.title}
        <br />
        Это базовая нода
      </div>
    </div>
  );
});
