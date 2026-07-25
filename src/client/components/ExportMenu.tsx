import React, { useState } from 'react';
import { useRoom } from '../context/RoomContext';
import { Download, FileImage, FileCode, FileText, Crop } from 'lucide-react';
import Konva from 'konva';

interface Props {
  stageRef: React.RefObject<Konva.Stage | null>;
  selectedId?: string | null;
}

export const ExportMenu: React.FC<Props> = ({ stageRef }) => {
  const { canvasObjects, roomId } = useRoom();
  const [isOpen, setIsOpen] = useState(false);

  const triggerDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Full Canvas PNG
  const exportPNG = () => {
    const stage = stageRef?.current;
    if (!stage) {
      console.warn('ExportMenu: Stage instance unavailable.');
      setIsOpen(false);
      return;
    }
    try {
      let dataUrl = '';
      try {
        dataUrl = stage.toDataURL({ pixelRatio: 2 });
      } catch (e) {
        dataUrl = stage.toDataURL({ pixelRatio: 1 });
      }
      triggerDownload(dataUrl, `boundless_canvas_${roomId}_${Date.now()}.png`);
    } catch (err) {
      console.error('PNG Export failed:', err);
    }
    setIsOpen(false);
  };

  // Export Selected Object / Frame PNG
  const exportSelectedPNG = () => {
    const stage = stageRef?.current;
    if (!stage) {
      console.warn('ExportMenu: Stage instance unavailable.');
      setIsOpen(false);
      return;
    }
    try {
      // Find selected transformer node or active selected shape
      const selectedNodes = stage.find('Transformer');
      let cropBounds = null;

      if (selectedNodes.length > 0) {
        const tr = selectedNodes[0] as Konva.Transformer;
        const nodes = tr.nodes();
        if (nodes.length > 0) {
          const rect = nodes[0].getClientRect();
          cropBounds = {
            x: Math.max(0, rect.x - 20),
            y: Math.max(0, rect.y - 20),
            width: rect.width + 40,
            height: rect.height + 40,
          };
        }
      }

      let dataUrl = '';
      try {
        dataUrl = stage.toDataURL(
          cropBounds
            ? { ...cropBounds, pixelRatio: 2 }
            : { pixelRatio: 2 }
        );
      } catch (e) {
        dataUrl = stage.toDataURL(
          cropBounds
            ? { ...cropBounds, pixelRatio: 1 }
            : { pixelRatio: 1 }
        );
      }
      triggerDownload(dataUrl, `boundless_selection_${roomId}_${Date.now()}.png`);
    } catch (err) {
      console.error('Selection PNG Export failed:', err);
    }
    setIsOpen(false);
  };

  // Export SVG Vector Format
  const exportSVG = () => {
    const objects = Array.from(canvasObjects.values());
    const minX = Math.min(...objects.map((o) => o.x), 0) - 100;
    const minY = Math.min(...objects.map((o) => o.y), 0) - 100;
    const maxX = Math.max(...objects.map((o) => o.x + (o.width || 100)), 1200) + 100;
    const maxY = Math.max(...objects.map((o) => o.y + (o.height || 100)), 800) + 100;
    const width = Math.max(800, maxX - minX);
    const height = Math.max(600, maxY - minY);

    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${width} ${height}" width="${width}" height="${height}" style="background-color: #121318;">\n`;

    objects.forEach((obj) => {
      if (obj.type === 'shape') {
        const fill = (obj as any).fill || '#6366f1';
        const stroke = (obj as any).stroke || fill;
        if ((obj as any).shapeType === 'circle') {
          const r = Math.min(obj.width, obj.height) / 2;
          svgContent += `  <circle cx="${obj.x + r}" cy="${obj.y + r}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2" />\n`;
        } else {
          svgContent += `  <rect x="${obj.x}" y="${obj.y}" width="${obj.width}" height="${obj.height}" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="2" />\n`;
        }
      } else if (obj.type === 'sticky') {
        const color = (obj as any).color || '#fef08a';
        const text = (obj as any).text || '';
        svgContent += `  <rect x="${obj.x}" y="${obj.y}" width="${obj.width}" height="${obj.height}" rx="6" fill="${color}" />\n`;
        svgContent += `  <text x="${obj.x + 14}" y="${obj.y + 30}" font-family="sans-serif" font-size="14" fill="#1e293b">${text}</text>\n`;
      } else if (obj.type === 'text') {
        const fill = (obj as any).fill || '#e5e7eb';
        const text = (obj as any).text || '';
        svgContent += `  <text x="${obj.x}" y="${obj.y + 24}" font-family="sans-serif" font-size="${(obj as any).fontSize || 20}" fill="${fill}">${text}</text>\n`;
      }
    });

    svgContent += `</svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, `boundless_${roomId}_${Date.now()}.svg`);
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  // Export JSON Raw Canvas Data
  const exportJSON = () => {
    const objectsArray = Array.from(canvasObjects.values());
    const jsonString = JSON.stringify(
      {
        roomId,
        exportedAt: new Date().toISOString(),
        objectCount: objectsArray.length,
        objects: objectsArray,
      },
      null,
      2
    );

    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, `boundless_${roomId}_${Date.now()}.json`);
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="tool-btn"
        title="Export Canvas / Selection (PNG, SVG, JSON)"
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          border: '1px solid var(--bg-panel-border)',
          background: 'var(--btn-hover-bg)',
        }}
      >
        <Download size={18} />
      </button>

      {isOpen && (
        <div
          className="glass-panel animate-fade-in"
          style={{
            position: 'absolute',
            top: 50,
            right: 0,
            width: 200,
            padding: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            zIndex: 300,
          }}
        >
          <button
            onClick={exportPNG}
            className="tool-btn"
            style={{ width: '100%', height: 36, justifyContent: 'flex-start', padding: '0 12px', gap: 10, fontSize: 13 }}
          >
            <FileImage size={16} />
            <span>Export Full Canvas</span>
          </button>
          <button
            onClick={exportSelectedPNG}
            className="tool-btn"
            style={{ width: '100%', height: 36, justifyContent: 'flex-start', padding: '0 12px', gap: 10, fontSize: 13 }}
          >
            <Crop size={16} color="#3b82f6" />
            <span>Export Selection Only</span>
          </button>
          <button
            onClick={exportSVG}
            className="tool-btn"
            style={{ width: '100%', height: 36, justifyContent: 'flex-start', padding: '0 12px', gap: 10, fontSize: 13 }}
          >
            <FileCode size={16} />
            <span>Export SVG Vector</span>
          </button>
          <button
            onClick={exportJSON}
            className="tool-btn"
            style={{ width: '100%', height: 36, justifyContent: 'flex-start', padding: '0 12px', gap: 10, fontSize: 13 }}
          >
            <FileText size={16} />
            <span>Export JSON Data</span>
          </button>
        </div>
      )}
    </div>
  );
};
