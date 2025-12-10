import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  FileSignature, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ExternalLink,
  Download,
  RefreshCw
} from "lucide-react";

interface SignatureStatus {
  id: string;
  documentId: string;
  docusealTemplateId: string;
  docusealSubmissionId: string;
  docusealUrl: string;
  docusealEditUrl: string;
  status: string;
  createdAt: string;
  completedAt?: string;
}

interface ApproverStatus {
  id: string;
  name: string;
  email: string;
  status: string;
  signedAt?: string;
  orderIndex: number;
}

export default function SignatureStatus() {
  const [, params] = useRoute("/documents/:documentId/signature-status");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [document, setDocument] = useState<any>(null);
  const [signatureEnvelope, setSignatureEnvelope] = useState<SignatureStatus | null>(null);
  const [approvers, setApprovers] = useState<ApproverStatus[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const documentId = params?.documentId;

  useEffect(() => {
    if (documentId) {
      fetchSignatureStatus();
    }
  }, [documentId]);

  const fetchSignatureStatus = async () => {
    try {
      setLoading(true);
      
      // Fetch document info
      const docResponse = await fetch(`/api/documents/${documentId}`);
      if (docResponse.ok) {
        const docData = await docResponse.json();
        setDocument(docData);
      }

      // Fetch signature envelope status
      const envelopeResponse = await fetch(`/api/documents/${documentId}/signature-status`);
      if (envelopeResponse.ok) {
        const envelopeData = await envelopeResponse.json();
        setSignatureEnvelope(envelopeData);
      }

      // Fetch approvers status
      const approversResponse = await fetch(`/api/documents/${documentId}/approvers`);
      if (approversResponse.ok) {
        const approversData = await approversResponse.json();
        setApprovers(approversData);
      }
    } catch (error) {
      console.error("Failed to fetch signature status:", error);
      toast({
        title: "Error",
        description: "Failed to fetch signature status.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSignatureStatus();
    setRefreshing(false);
    
    toast({
      title: "Status Updated",
      description: "Signature status has been refreshed.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'signed':
      case 'approved':
        return 'text-green-600 bg-green-100 dark:bg-green-900';
      case 'pending':
      case 'sent':
      case 'in_review':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900';
      case 'declined':
      case 'rejected':
        return 'text-red-600 bg-red-100 dark:bg-red-900';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'signed':
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
      case 'sent':
      case 'in_review':
        return <Clock className="h-4 w-4" />;
      case 'declined':
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const calculateProgress = () => {
    if (approvers.length === 0) return 0;
    const completedCount = approvers.filter(a => 
      a.status.toLowerCase() === 'approved' || 
      a.status.toLowerCase() === 'signed' ||
      a.status.toLowerCase() === 'completed'
    ).length;
    return (completedCount / approvers.length) * 100;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (!documentId || !signatureEnvelope) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Signature Status Not Found</h2>
          <p className="text-muted-foreground mb-4">No signature workflow found for this document.</p>
          <Button onClick={() => setLocation("/documents")}>
            Back to Documents
          </Button>
        </div>
      </div>
    );
  }

  const progress = calculateProgress();

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/documents")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Documents
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Digital Signature Status</h1>
          <p className="text-muted-foreground">Monitor the progress of document signing</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {document && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5" />
              Document Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Filename</p>
                <p className="text-sm text-muted-foreground">{document.filename}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Status</p>
                <Badge className={getStatusColor(signatureEnvelope.status)}>
                  {signatureEnvelope.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(signatureEnvelope.createdAt).toLocaleString()}
                </p>
              </div>
              {signatureEnvelope.completedAt && (
                <div>
                  <p className="text-sm font-medium">Completed</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(signatureEnvelope.completedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Signature Progress</CardTitle>
          <CardDescription>
            {Math.round(progress)}% completed ({approvers.filter(a => 
              a.status.toLowerCase() === 'approved' || 
              a.status.toLowerCase() === 'signed' ||
              a.status.toLowerCase() === 'completed'
            ).length} of {approvers.length} approvers)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="mb-4" />
          
          <div className="space-y-3">
            {approvers
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((approver, index) => (
                <div
                  key={approver.id}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-sm font-medium">
                    {index + 1}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{approver.name}</span>
                      <Badge variant="outline" className={getStatusColor(approver.status)}>
                        {getStatusIcon(approver.status)}
                        <span className="ml-1">{approver.status}</span>
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{approver.email}</p>
                    {approver.signedAt && (
                      <p className="text-xs text-green-600">
                        Signed: {new Date(approver.signedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>
            Manage the signature workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {signatureEnvelope.docusealUrl && (
              <Button
                variant="outline"
                onClick={() => window.open(signatureEnvelope.docusealUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View in DocuSeal
              </Button>
            )}
            
            {signatureEnvelope.docusealEditUrl && signatureEnvelope.status !== 'COMPLETED' && (
              <Button
                variant="outline"
                onClick={() => window.open(signatureEnvelope.docusealEditUrl, '_blank')}
              >
                <FileSignature className="h-4 w-4 mr-2" />
                Edit Template
              </Button>
            )}
            
            {signatureEnvelope.status === 'COMPLETED' && (
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Download Signed Document
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={() => setLocation(`/documents`)}
            >
              Back to Documents
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}