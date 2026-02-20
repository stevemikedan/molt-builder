'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableRuleProps {
  id: string;
  index: number;
  value: string;
  onChange: (value: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function SortableRule({ id, index, value, onChange, onRemove, canRemove }: SortableRuleProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-2 group">
      <button
        {...attributes}
        {...listeners}
        className="mt-2.5 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing shrink-0"
        aria-label="Drag to reorder"
      >
        ⠿
      </button>
      <span className="mt-2.5 text-xs text-gray-400 w-4 shrink-0">{index + 1}.</span>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={2}
        maxLength={500}
        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
      />
      <button
        onClick={onRemove}
        disabled={!canRemove}
        className="mt-2.5 text-gray-300 hover:text-red-400 disabled:opacity-0 shrink-0 transition-colors"
        aria-label="Remove rule"
      >
        ✕
      </button>
    </div>
  );
}

interface VoiceRulesListProps {
  rules: string[];
  onChange: (rules: string[]) => void;
}

export function VoiceRulesList({ rules, onChange }: VoiceRulesListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Use index-based IDs so drag works even with duplicate text
  const [ids] = useState(() => rules.map((_, i) => String(i)));
  const [stableIds, setStableIds] = useState(ids);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = stableIds.indexOf(String(active.id));
    const newIndex = stableIds.indexOf(String(over.id));

    setStableIds(arrayMove(stableIds, oldIndex, newIndex));
    onChange(arrayMove(rules, oldIndex, newIndex));
  }

  function updateRule(index: number, value: string) {
    const next = [...rules];
    next[index] = value;
    onChange(next);
  }

  function removeRule(index: number) {
    const nextIds = stableIds.filter((_, i) => i !== index);
    setStableIds(nextIds);
    onChange(rules.filter((_, i) => i !== index));
  }

  function addRule() {
    if (rules.length >= 10) return;
    const newId = String(Date.now());
    setStableIds([...stableIds, newId]);
    onChange([...rules, '']);
  }

  return (
    <div className="flex flex-col gap-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={stableIds} strategy={verticalListSortingStrategy}>
          {rules.map((rule, i) => (
            <SortableRule
              key={stableIds[i]}
              id={stableIds[i]}
              index={i}
              value={rule}
              onChange={v => updateRule(i, v)}
              onRemove={() => removeRule(i)}
              canRemove={rules.length > 1}
            />
          ))}
        </SortableContext>
      </DndContext>

      {rules.length < 10 && (
        <button
          onClick={addRule}
          className="self-start text-sm text-gray-500 hover:text-gray-800 underline"
        >
          + Add rule
        </button>
      )}
      <p className="text-xs text-gray-400">{rules.length}/10 rules — drag to reorder</p>
    </div>
  );
}
