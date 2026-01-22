import Dashboard from '@/components/dashboard/Dashboard';
import { getScenarioConfig } from '@/lib/dashboard/scenarios';

export default function Demo() {
  // 시나리오: 투망감시
  const scenarioConfig = getScenarioConfig('surveillance');

  return <Dashboard scenarioConfig={scenarioConfig} />;
}
