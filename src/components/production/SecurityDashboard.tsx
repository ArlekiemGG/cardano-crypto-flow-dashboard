
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { securityManager } from '@/services/securityManager';
import { supabase } from '@/integrations/supabase/client';
import { 
  Shield, 
  AlertTriangle, 
  Lock, 
  Eye, 
  Activity,
  CheckCircle,
  XCircle
} from 'lucide-react';

export const SecurityDashboard: React.FC = () => {
  const [auditTrail, setAuditTrail] = useState<any[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<any[]>([]);
  const [securityMetrics, setSecurityMetrics] = useState({
    totalTransactions: 0,
    blockedTransactions: 0,
    suspiciousActivity: 0,
    httpsEnforced: false
  });

  useEffect(() => {
    loadSecurityData();
    checkHTTPSStatus();
  }, []);

  const loadSecurityData = async () => {
    try {
      // Load audit trail
      const { data: audit } = await supabase
        .from('audit_trail')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(20);

      // Load security alerts
      const { data: alerts } = await supabase
        .from('system_alerts')
        .select('*')
        .eq('resolved', false)
        .order('timestamp', { ascending: false });

      setAuditTrail(audit || []);
      setSecurityAlerts(alerts || []);

      // Calculate security metrics
      const totalTx = audit?.length || 0;
      const blocked = audit?.filter(a => a.action.includes('blocked')).length || 0;
      const suspicious = alerts?.filter(a => a.severity === 'high').length || 0;

      setSecurityMetrics({
        totalTransactions: totalTx,
        blockedTransactions: blocked,
        suspiciousActivity: suspicious,
        httpsEnforced: await securityManager.enforceHTTPS()
      });
    } catch (error) {
      console.error('Error loading security data:', error);
    }
  };

  const checkHTTPSStatus = async () => {
    const httpsStatus = await securityManager.enforceHTTPS();
    setSecurityMetrics(prev => ({ ...prev, httpsEnforced: httpsStatus }));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-400 bg-red-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/20';
      case 'low': return 'text-green-400 bg-green-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Security Dashboard</h2>
        <p className="text-gray-400">Production security monitoring and compliance</p>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-green-400" />
              <div>
                <p className="text-sm text-gray-400">Total Transactions</p>
                <p className="text-lg font-bold text-white">
                  {securityMetrics.totalTransactions}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-400" />
              <div>
                <p className="text-sm text-gray-400">Blocked</p>
                <p className="text-lg font-bold text-white">
                  {securityMetrics.blockedTransactions}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              <div>
                <p className="text-sm text-gray-400">Suspicious Activity</p>
                <p className="text-lg font-bold text-white">
                  {securityMetrics.suspiciousActivity}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              {securityMetrics.httpsEnforced ? (
                <CheckCircle className="h-4 w-4 text-green-400" />
              ) : (
                <XCircle className="h-4 w-4 text-red-400" />
              )}
              <div>
                <p className="text-sm text-gray-400">HTTPS</p>
                <Badge className={securityMetrics.httpsEnforced ? 'text-green-400 bg-green-400/20' : 'text-red-400 bg-red-400/20'}>
                  {securityMetrics.httpsEnforced ? 'Enforced' : 'Not Enforced'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Alerts */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <span>Active Security Alerts</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {securityAlerts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-2" />
              <p className="text-gray-400">No active security alerts</p>
            </div>
          ) : (
            <div className="space-y-3">
              {securityAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-4 w-4 text-yellow-400" />
                    <div>
                      <p className="font-medium text-white">{alert.message}</p>
                      <p className="text-sm text-gray-400">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge className={getSeverityColor(alert.severity)}>
                    {alert.severity.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Trail */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5 text-blue-400" />
            <span>Recent Audit Trail</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {auditTrail.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-2 rounded bg-white/5">
                <div className="flex items-center space-x-3">
                  <Activity className="h-3 w-3 text-gray-400" />
                  <div>
                    <p className="text-sm text-white">{entry.action}</p>
                    <p className="text-xs text-gray-400">
                      {entry.user_wallet?.substring(0, 8)}...{entry.user_wallet?.slice(-4)}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
