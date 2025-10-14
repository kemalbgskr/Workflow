import TimelineStepper from '../TimelineStepper';

export default function TimelineStepperExample() {
  const sdlcSteps = [
    { label: "Initiative", status: "completed" as const },
    { label: "Demand", status: "completed" as const },
    { label: "Approved", status: "completed" as const },
    { label: "Kick Off", status: "current" as const },
    { label: "ARF", status: "pending" as const },
    { label: "Deployment", status: "pending" as const },
    { label: "PTR", status: "pending" as const },
    { label: "Go Live", status: "pending" as const },
  ];

  return (
    <div className="space-y-12 p-8">
      <div>
        <h3 className="text-sm font-medium mb-6">Current Project Timeline</h3>
        <TimelineStepper steps={sdlcSteps} />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-6">Completed Project</h3>
        <TimelineStepper 
          steps={sdlcSteps.map(s => ({ ...s, status: "completed" as const }))} 
        />
      </div>
    </div>
  );
}
