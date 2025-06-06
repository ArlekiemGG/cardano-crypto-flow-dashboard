
import { DataDashboard } from './dashboard/DataDashboard';
import { SimplifiedDiagnostics } from './dashboard/SimplifiedDiagnostics';

export const SimplifiedOptimizedDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Diagnóstico simplificado */}
      <SimplifiedDiagnostics />
      
      {/* Dashboard principal de datos */}
      <DataDashboard />
    </div>
  );
};
