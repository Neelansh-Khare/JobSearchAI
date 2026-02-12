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
import { Job } from '@/types';

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
    if (!activeJob) {
      return;
    }

    // Determine the new status based on drop target
    let newStatus: Job['status'] | undefined;

    // Check if dropped on a column (status string)
    if (STATUSES.includes(over.id as Job['status'])) {
      newStatus = over.id as Job['status'];
    } 
    // Check if dropped on another job (number ID)
    else {
      const overJob = jobs.find((j) => j.id === over.id);
      if (overJob) {
        newStatus = overJob.status;
      }
    }

    if (newStatus && activeJob.status !== newStatus) {
      await onJobMove(activeJob.id, newStatus);
    }
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
