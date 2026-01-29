'use client';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import KanbanColumn from './KanbanColumn';
import { Job } from '@/services/api';

const STATUSES: Job['status'][] = ['New', 'Saved', 'Applied', 'Interview', 'Offer', 'Rejected'];

interface KanbanBoardProps {
  jobs: Job[];
  onJobMove: (jobId: number, newStatus: Job['status']) => Promise<void>;
  onJobDelete: (jobId: number) => Promise<void>;
}

export default function KanbanBoard({ jobs, onJobMove, onJobDelete }: KanbanBoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const activeJob = jobs.find((j) => j.id === active.id);
    const overColumn = over.id as string;

    if (!activeJob || !STATUSES.includes(overColumn as Job['status'])) {
      return;
    }

    const newStatus = overColumn as Job['status'];
    await onJobMove(activeJob.id, newStatus);
  };

  const getJobsByStatus = (status: Job['status']) => {
    return jobs.filter((job) => job.status === status);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            jobs={getJobsByStatus(status)}
            onDelete={onJobDelete}
          />
        ))}
      </div>
    </DndContext>
  );
}
