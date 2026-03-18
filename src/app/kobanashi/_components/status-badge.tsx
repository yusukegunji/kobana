import { Badge } from "@/components/ui/badge";
import { STATUS_COLORS } from "@/lib/constants";
import type { KobanashiStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: KobanashiStatus }) {
  return (
    <Badge variant="secondary" className={STATUS_COLORS[status]}>
      {status}
    </Badge>
  );
}
