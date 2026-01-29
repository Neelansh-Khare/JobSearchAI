'use client';

import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import GlassCard from '@/components/GlassCard';
import JobCard from './JobCard';
import { Job } from '@/services/api';

interface KanbanColumnProps {
  status: Job['status'];
  jobs: Job[];
  onDelete: (id: number) => void;
}

export default function KanbanColumn({ status, jobs, onDelete }: KanbanColumnProps) {
  return (
    <div className="flex flex-col">
      <GlassCard className="p-4 mb-4">
        <h2 className="text-lg font-bold mb-2">{status}</h2>
        <p className="text-sm opacity-70">{jobs.length} jobs</p>
      </GlassCard>
      <div className="flex-1 min-h-[200px]">
        <SortableContext
          items={jobs.map((j) => j.id)}
          strategy={verticalListSortingStrategy}
        >
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} onDelete={onDelete} />
          ))}
        </SortableContext>
        {jobs.length === 0 && (
          <div className="text-center text-sm opacity-50 py-8">
            Drop jobs here
          </div>
        )}
      </div>
    </div>
  );
}
