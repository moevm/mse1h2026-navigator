import { memo } from "react";
import type { FC } from "react";
import type { MainNode as PropsType } from "../types/nodes";
import { Handle, Position } from "@xyflow/react";

export const MainNode: FC<PropsType> = memo(({ data }) => {
  return (
    <div className="bg-white rounded-full p-2 aspect-square flex items-center justify-center">
      <Handle id="top-source" type="source" position={Position.Top} />
      <Handle id="bottom-source" type="source" position={Position.Bottom} />
      <Handle id="left-source" type="source" position={Position.Left} />
      <Handle id="right-source" type="source" position={Position.Right} />

      <Handle id="top-target" type="target" position={Position.Top} />
      <Handle id="bottom-target" type="target" position={Position.Bottom} />
      <Handle id="left-target" type="target" position={Position.Left} />
      <Handle id="right-target" type="target" position={Position.Right} />

      <div className="text-center break-words px-2 max-w-30">
        {data.title}
        <br />
        Это основная нода
      </div>
    </div>
  );
});
