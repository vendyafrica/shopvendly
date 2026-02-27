import { pgEnum } from "drizzle-orm/pg-core";

export const onboardingStepEnum = pgEnum("onboarding_step", [
    "signup",
    "personal",
    "store",
    "business",
    "complete"
]);
