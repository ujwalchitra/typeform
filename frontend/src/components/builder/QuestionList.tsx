"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Copy } from "lucide-react";
import type { Question, QuestionType } from "@/lib/types";
import { QUESTION_TYPE_LABELS, QUESTION_TYPE_ICONS } from "@/lib/types";

interface QuestionListProps {
  questions: Question[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onReorder: (items: { id: string; order: number }[]) => void;
}

function SortableQuestionItem({
  question,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
}: {
  question: Question;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
        isSelected
          ? "border-typeform-accent bg-blue-50"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
      onClick={onSelect}
    >
      <button
        className="cursor-grab text-gray-300 hover:text-gray-500 active:cursor-grabbing"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={16} />
      </button>
      <span className="flex h-7 w-7 items-center justify-center rounded bg-gray-100 text-xs font-medium text-gray-600">
        {QUESTION_TYPE_ICONS[question.type]}
      </span>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-gray-900">
          {question.title || "Untitled question"}
        </p>
        <p className="text-xs text-gray-400">
          {QUESTION_TYPE_LABELS[question.type]}
          {question.required && " · Required"}
        </p>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <Copy size={14} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

export function QuestionList({
  questions,
  selectedId,
  onSelect,
  onDelete,
  onDuplicate,
  onReorder,
}: QuestionListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = questions.findIndex((q) => q.id === active.id);
    const newIndex = questions.findIndex((q) => q.id === over.id);

    const reordered = [...questions];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    onReorder(reordered.map((q, i) => ({ id: q.id, order: i })));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={questions.map((q) => q.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2">
          {questions.map((q) => (
            <SortableQuestionItem
              key={q.id}
              question={q}
              isSelected={selectedId === q.id}
              onSelect={() => onSelect(q.id)}
              onDelete={() => onDelete(q.id)}
              onDuplicate={() => onDuplicate(q.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export const QUESTION_TYPES: { type: QuestionType; label: string; icon: string }[] = [
  { type: "short_text", label: "Short Text", icon: "Aa" },
  { type: "long_text", label: "Long Text", icon: "¶" },
  { type: "multiple_choice", label: "Multiple Choice", icon: "☑" },
  { type: "dropdown", label: "Dropdown", icon: "▼" },
  { type: "email", label: "Email", icon: "@" },
  { type: "number", label: "Number", icon: "#" },
  { type: "yes_no", label: "Yes / No", icon: "✓" },
  { type: "rating", label: "Rating", icon: "★" },
];
