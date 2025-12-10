import { Badge } from "@/components/ui/badge";
import { Check, Clock, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

interface ProjectStatusTimelineProps {
  projectId: string;
  currentStatus: string;
}

const SDLC_STATUSES = [
  "Initiative Submitted",
  "Demand Prioritized", 
  "Initiative Approved",
  "Kick Off",
  "ARF",
  "Deployment Preparation",
  "RCB",
  "Deployment",
  "PTR",
  "Go Live"
];

export default function ProjectStatusTimeline({ projectId, currentStatus }: ProjectStatusTimelineProps) {
  const [statusRequest, setStatusRequest] = useState<any>(null);

  useEffect(() => {
    fetchStatusRequest();
  }, [projectId]);

  const fetchStatusRequest = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/status-request`);
      if (response.ok) {
        const data = await response.json();
        setStatusRequest(data);
      }
    } catch (error) {
      console.error('Failed to fetch status request:', error);
    }
  };

  const currentIndex = SDLC_STATUSES.indexOf(currentStatus);
  const targetIndex = statusRequest ? SDLC_STATUSES.indexOf(statusRequest.toStatus) : -1;

  const getStepStatus = (index: number) => {
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'current';
    if (statusRequest && index === targetIndex) return 'pending';
    return 'upcoming';
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check className="h-4 w-4 text-white" />;
      case 'current':
        return <div className="h-2 w-2 bg-white rounded-full" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-white" />;
      default:
        return <div className="h-2 w-2 bg-gray-400 rounded-full" />;
    }
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success';
      case 'current':
        return 'bg-brand-teal';
      case 'pending':
        return 'bg-brand-orange';
      default:
        return 'bg-gray-300';
    }
  };

  const getConnectorColor = (fromIndex: number) => {
    const fromStatus = getStepStatus(fromIndex);
    const toStatus = getStepStatus(fromIndex + 1);
    
    if (fromStatus === 'completed' && toStatus === 'completed') return 'bg-success';
    if (fromStatus === 'completed' && toStatus === 'current') return 'bg-success';
    if (fromStatus === 'current' && toStatus === 'pending') return 'bg-brand-orange';
    if (fromStatus === 'completed' && toStatus === 'pending') return 'bg-brand-orange';
    return 'bg-gray-200';
  };

  return (
    <div className="w-full">
      {statusRequest && (
        <div className="mb-4 p-3 bg-brand-orange/10 border border-brand-orange/20 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-brand-orange" />
            <span className="text-sm font-medium text-brand-orange">
              Status Change Pending Approval: {statusRequest.fromStatus} → {statusRequest.toStatus}
            </span>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between relative">
        {SDLC_STATUSES.map((status, index) => {
          const stepStatus = getStepStatus(index);
          const isLast = index === SDLC_STATUSES.length - 1;
          
          return (
            <div key={status} className="flex flex-col items-center relative flex-1">
              {/* Step Circle */}
              <div className={`
                relative z-10 w-8 h-8 rounded-full flex items-center justify-center
                ${getStepColor(stepStatus)}
                ${stepStatus === 'current' ? 'ring-4 ring-brand-teal/20' : ''}
                ${stepStatus === 'pending' ? 'ring-4 ring-brand-orange/20 animate-pulse' : ''}
              `}>
                {getStepIcon(stepStatus)}
              </div>
              
              {/* Connector Line */}
              {!isLast && (
                <div className={`
                  absolute top-4 left-1/2 w-full h-0.5 -translate-y-1/2
                  ${getConnectorColor(index)}
                  ${statusRequest && index === currentIndex && targetIndex > currentIndex ? 'animate-pulse' : ''}
                `} style={{ zIndex: 1 }} />
              )}
              
              {/* Status Label */}
              <div className="mt-2 text-center">
                <Badge 
                  variant={stepStatus === 'current' ? 'default' : 
                          stepStatus === 'completed' ? 'secondary' :
                          stepStatus === 'pending' ? 'destructive' : 'outline'}
                  className={`text-xs whitespace-nowrap ${
                    stepStatus === 'pending' ? 'bg-brand-orange text-white' : ''
                  }`}
                >
                  {status}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}