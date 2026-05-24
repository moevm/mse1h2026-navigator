import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import type { GraphFileFormat } from "@/api/types";
import { exportGraphFile } from "@/api/graphs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  downloadBlob,
  getGraphDownloadFileName,
  graphFileFormats,
} from "@/lib/graphFiles";

interface GraphExportDialogProps {
  graphId: string | null;
  graphTitle?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GraphExportDialog({
  graphId,
  graphTitle,
  open,
  onOpenChange,
}: GraphExportDialogProps) {
  const [format, setFormat] = useState<GraphFileFormat>("rdfxml");
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    if (!graphId) {
      setError("Не выбран граф для экспорта");
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      const blob = await exportGraphFile(graphId, format);
      downloadBlob(blob, getGraphDownloadFileName(graphId, format));
      onOpenChange(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Не удалось скачать граф");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Экспорт графа</DialogTitle>
          <DialogDescription>
            {graphTitle
              ? `Выберите формат файла для графа "${graphTitle}".`
              : "Выберите формат файла для скачивания графа."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {(Object.keys(graphFileFormats) as GraphFileFormat[]).map((item) => (
            <label
              key={item}
              className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 px-3 py-3 text-sm transition hover:border-slate-400"
            >
              <input
                type="radio"
                name="graph-export-format"
                checked={format === item}
                onChange={() => setFormat(item)}
                className="mt-0.5 size-4 accent-slate-900"
              />
              <span>
                <span className="block font-medium text-slate-900">
                  {graphFileFormats[item].label}
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  {item === "rdfxml"
                    ? "Подходит для OWL/RDF-инструментов."
                    : "Текстовый RDF-формат, удобный для просмотра и версионирования."}
                </span>
              </span>
            </label>
          ))}
        </div>

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Отмена
          </Button>
          <Button type="button" onClick={handleExport} disabled={isExporting}>
            {isExporting ? <Loader2 className="animate-spin" /> : <Download />}
            Скачать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
