import { memo } from "react";
import type { FC } from "react";
import type { MainNode as PropsType } from "../types/nodes";
import { Handle, Position } from "@xyflow/react";

export const MainNode: FC<PropsType> = memo(({ data }) => {
  return (
    <div className="bg-white rounded-full p-2 aspect-square flex items-center justify-center">
      <Handle type="source" position={Position.Bottom} />

      <div className="text-center break-words px-2 max-w-30">
        {data.title}
        <br />
        Это основная нода
      </div>
    </div>
  );
});
