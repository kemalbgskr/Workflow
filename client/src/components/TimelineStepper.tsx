import { Check } from "lucide-react";

interface TimelineStep {
  label: string;
  status: "completed" | "current" | "pending" | "waiting";
}

interface TimelineStepperProps {
  steps: TimelineStep[];
  className?: string;
  onStepClick?: (stepLabel: string) => void;
}

export default function TimelineStepper({ steps, className = "", onStepClick }: TimelineStepperProps) {
  return (
    <div className={`w-full ${className}`} data-testid="timeline-stepper">
      <div className="flex items-center justify-between gap-2">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="flex items-center w-full">
                <div 
                  className={`
                    flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors cursor-pointer hover:scale-110
                    ${step.status === 'completed' ? 'bg-success border-success' : ''}
                    ${step.status === 'current' ? 'bg-brand-teal border-brand-teal' : ''}
                    ${step.status === 'waiting' ? 'bg-orange-500 border-orange-500 animate-pulse' : ''}
                    ${step.status === 'pending' ? 'bg-muted border-border hover:border-brand-teal/50' : ''}
                  `}
                  onClick={() => onStepClick?.(step.label)}
                >
                  {step.status === 'completed' && (
                    <Check className="h-4 w-4 text-white" />
                  )}
                  {step.status === 'current' && (
                    <div className="w-3 h-3 bg-white rounded-full" />
                  )}
                  {step.status === 'waiting' && (
                    <div className="w-3 h-3 bg-white rounded-full" />
                  )}
                  {step.status === 'pending' && (
                    <div className="w-3 h-3 bg-muted-foreground/30 rounded-full" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${
                    step.status === 'completed' ? 'bg-success' : 'bg-border'
                  }`} />
                )}
              </div>
              <span className={`text-xs text-center font-medium whitespace-nowrap ${
                step.status === 'current' ? 'text-foreground' : step.status === 'waiting' ? 'text-orange-500' : 'text-muted-foreground'
              }`}>
                {step.label}
                {step.status === 'waiting' && (
                  <span className="block text-[10px] text-orange-500 mt-0.5">Waiting for approval</span>
                )}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}