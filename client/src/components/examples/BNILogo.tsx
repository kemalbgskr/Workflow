import BNILogo from '../BNILogo';

export default function BNILogoExample() {
  return (
    <div className="space-y-8 p-8">
      <div>
        <p className="text-sm text-muted-foreground mb-4">Small</p>
        <BNILogo size="sm" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-4">Medium (Default)</p>
        <BNILogo size="md" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-4">Large</p>
        <BNILogo size="lg" />
      </div>
    </div>
  );
}
