import Modal from "react-modal";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { useNodeModalStore } from "../services/nodeModalStore.context";
import type { MainSkill, Skill } from "@/entities/skill";

type NodeModalData = Partial<Skill & MainSkill>;

export const NodeModal = observer(() => {
  const nodeModalStore = useNodeModalStore();

  useEffect(() => {
    Modal.setAppElement("#root");
  }, []);

  const selectedNode = nodeModalStore.selectedNode;
  const data = (selectedNode?.data ?? {}) as NodeModalData;

  return (
    <Modal
      isOpen={nodeModalStore.isOpen}
      onRequestClose={nodeModalStore.close}
      shouldCloseOnOverlayClick={true}
      overlayClassName="fixed inset-0 bg-black/40 flex items-center justify-center p-4"
      className="bg-white rounded-xl p-6 w-full max-w-md outline-none"
      contentLabel="Node information"
    >
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-xl font-semibold">Информация о ноде</h2>
        <button
          type="button"
          className="text-sm text-gray-500 hover:text-gray-700"
          onClick={nodeModalStore.close}
        >
          Закрыть
        </button>
      </div>

      <div className="mt-4 space-y-2 text-sm text-gray-800">
        <p>
          <span className="font-medium">ID:</span> {selectedNode?.id ?? "-"}
        </p>
        <p>
          <span className="font-medium">Тип ноды:</span> {selectedNode?.type ?? "-"}
        </p>
        <p>
          <span className="font-medium">Название:</span> {data.title ?? "-"}
        </p>
        <p>
          <span className="font-medium">Описание:</span> {data.description ?? "-"}
        </p>
      </div>
    </Modal>
  );
});
