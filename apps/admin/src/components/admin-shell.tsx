import { Badge, BrandLockup, Cluster, EnvironmentBadge, NetworkBadge } from '@armz-clash/ui';
import type { PublicConfig } from '@armz-clash/config';

const modules = [
  'Overview',
  'Players',
  'ARMZ',
  'Battles',
  'Economy',
  'Claims',
  'Marketplace',
  'Oracle',
  'Treasury',
  'Fraud',
  'Audit Logs',
  'Configuration',
] as const;

export function AdminHeader({ config }: { config: PublicConfig }) {
  return (
    <header className="border-b border-[var(--armz-border)] bg-[rgba(11,14,20,0.94)]">
      <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-3 px-[var(--armz-page-x)] py-3 pt-[calc(0.75rem+var(--armz-safe-top))]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <BrandLockup />
            <span className="text-sm font-medium text-[var(--armz-text-secondary)]">Admin</span>
            <Badge variant="warning">Internal foundation</Badge>
          </div>
          <Cluster gap="sm">
            <EnvironmentBadge environment={config.environment} />
            <NetworkBadge network={config.networkLabel} />
            <Badge variant="success">Real-value systems disabled</Badge>
          </Cluster>
        </div>
        <nav
          aria-label="Admin modules"
          className="flex gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {modules.map((name) => (
            <span
              key={name}
              className="inline-flex min-h-10 shrink-0 items-center rounded-md px-3 py-2 text-sm text-[var(--armz-text-muted)]"
              aria-disabled="true"
              title={`${name} module unavailable until later phases`}
            >
              {name}
            </span>
          ))}
        </nav>
      </div>
    </header>
  );
}
