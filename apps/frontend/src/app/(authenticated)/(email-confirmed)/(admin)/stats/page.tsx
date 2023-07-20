import { SoleModelLayout } from "~/components/layout/sole-model";
import { ModelCard } from "~/components/model-card";
import { urls } from "~/urls";

const stats = [
  "dau",
  "wau",
  "mau",
  "registrations",
  "likes",
  "homies",
  "matches",
  "bans",
  "visible",
  ...[1, 2, 7, 14, 30, 60, 90, 180, 365].map((n) => `retention_${n}`),
  ...[1, 2, 7, 14, 30, 60, 90, 180, 365].map((n) => `retention_visible_${n}`)
];

export default function StatsPage() {
  return (
    <SoleModelLayout>
      <ModelCard className="w-full sm:max-w-2xl" title="Stats">
        {stats.map((stat) => (
          <div className="flex gap-2" key={stat}>
            {stat}
            <a className="underline" href={urls.admin.statsData(stat)}>
              Data
            </a>
            <a className="underline" href={urls.admin.statsChart(stat)}>
              Chart
            </a>
          </div>
        ))}
      </ModelCard>
    </SoleModelLayout>
  );
}
