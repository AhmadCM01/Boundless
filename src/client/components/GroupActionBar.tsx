import React from 'react';
import { useRoom } from '../context/RoomContext';
import { Group as GroupIcon, Ungroup } from 'lucide-react';

interface GroupActionBarProps {
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  stageX: number;
  stageY: number;
  zoom: number;
}

export const GroupActionBar: React.FC<GroupActionBarProps> = ({
  selectedIds,
  setSelectedIds,
  stageX,
  stageY,
  zoom,
}) => {
  const { canvasObjects, updateObject, doc } = useRoom();

  if (selectedIds.length <= 1) {
    const singleObj = selectedIds.length === 1 ? canvasObjects.get(selectedIds[0]) : null;
    if (!singleObj || !singleObj.groupId) return null;
  }

  const selectedObjs = selectedIds
    .map((id) => canvasObjects.get(id))
    .filter(Boolean);

  if (selectedObjs.length === 0) return null;

  // Check if all selected items already belong to the same groupId
  const firstGroupId = selectedObjs[0]?.groupId;
  const isAllGroupedTogether =
    Boolean(firstGroupId) && selectedObjs.every((o) => o?.groupId === firstGroupId);

  // Group Selected Objects
  const handleGroup = () => {
    if (!doc) return;
    const newGroupId = `group_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    doc.transact(() => {
      selectedIds.forEach((id) => {
        updateObject(id, { groupId: newGroupId });
      });
    });
  };

  // Ungroup Selected Objects
  const handleUngroup = () => {
    if (!doc) return;
    doc.transact(() => {
      selectedIds.forEach((id) => {
        updateObject(id, { groupId: undefined });
      });
    });
  };

  // Calculate Group Bounding Box Center for Floating Positioning
  let minX = Infinity, minY = Infinity, maxX = -Infinity;
  selectedObjs.forEach((obj) => {
    if (obj) {
      minX = Math.min(minX, obj.x);
      minY = Math.min(minY, obj.y);
      const w = obj.width || 100;
      maxX = Math.max(maxX, obj.x + w);
    }
  });

  const screenCenterX = (minX + (maxX - minX) / 2) * zoom + stageX;
  const screenTopY = minY * zoom + stageY - 48;

  return (
    <div
      className="glass-panel animate-fade-in"
      style={{
        position: 'absolute',
        top: Math.max(76, screenTopY),
        left: Math.max(12, screenCenterX),
        transform: 'translateX(-50%)',
        height: 40,
        padding: '0 8px',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        zIndex: 200,
        borderRadius: 10,
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      }}
    >
      {!isAllGroupedTogether && selectedIds.length > 1 && (
        <button
          onClick={handleGroup}
          className="tool-btn"
          title="Group Selected Objects"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-main)',
            height: 30,
          }}
        >
          <GroupIcon size={14} color="var(--accent-primary)" />
          <span>Group Objects</span>
        </button>
      )}

      {firstGroupId && (
        <button
          onClick={handleUngroup}
          className="tool-btn"
          title="Ungroup Selected Objects"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-main)',
            height: 30,
          }}
        >
          <Ungroup size={14} color="#f59e0b" />
          <span>Ungroup Objects</span>
        </button>
      )}
    </div>
  );
};
