import * as Sentry from "@sentry/nextjs";
import { getSentryOptions } from "@/lib/monitoring/sentry-options";

Sentry.init(getSentryOptions());
