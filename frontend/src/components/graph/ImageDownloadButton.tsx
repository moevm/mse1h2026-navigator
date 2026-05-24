import { Panel, useReactFlow, getNodesBounds, getViewportForBounds } from '@xyflow/react';
import { toPng } from 'html-to-image';

function downloadImage(dataUrl: string) {
    const a = document.createElement('a');

    a.setAttribute('download', 'reactflow.png');
    a.setAttribute('href', dataUrl);
    a.click();
}

const imageWidth = 1024;
const imageHeight = 768;

export function DownloadButton() {
    const { getNodes } = useReactFlow();
    const onClick = () => {
        const viewportElement = document.querySelector<HTMLElement>('.react-flow__viewport');
        if (!viewportElement) {
            return;
        }

        const nodesBounds = getNodesBounds(getNodes());
        const viewport = getViewportForBounds(nodesBounds, imageWidth, imageHeight, 0.5, 2, 0.1);

        toPng(viewportElement, {
            backgroundColor: '#1a365d',
            width: imageWidth,
            height: imageHeight,
            style: {
                width: `${imageWidth}px`,
                height: `${imageHeight}px`,
                transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
            },
        }).then(downloadImage);
    };

    return (
        <Panel position="top-right">
            <button className="bg-blue-300 px-5 py-2 rounded-l text-[10px]" onClick={onClick}>
                Скачать изображение
            </button>
        </Panel>
    );
}
