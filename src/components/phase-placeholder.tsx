import {
  CheckCircle2,
  Construction,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function PhasePlaceholder({
  icon: Icon,
  title,
  description,
  phase = "Akan tersedia pada fase berikutnya",
  features,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  phase?: string;
  features: string[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <Card className="overflow-hidden border-dashed">
        <CardContent className="flex flex-col items-start gap-4 p-6 sm:p-8">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="size-6" />
          </div>
          <Badge variant="secondary" className="gap-1.5">
            <Construction className="size-3" />
            {phase}
          </Badge>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-balance">
              {title}
            </h2>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4 text-primary" />
            Yang akan tersedia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {features.map((feature) => (
              <li key={feature} className="flex gap-2.5 text-sm">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                <span className="leading-relaxed text-muted-foreground">
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
