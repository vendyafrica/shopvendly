import { z } from "zod";
import { onboardingRepository } from "@/modules/onboarding/lib/onboarding-repository";
import { withApi } from "@/lib/api/with-api";
import { jsonSuccess, jsonError, HttpError } from "@/lib/api/response-utils";

const checkSchema = z.object({
    type: z.enum(["phone", "storeName"]),
    value: z.string().min(1),
});

export const POST = withApi({ auth: false, schema: checkSchema }, async ({ body }) => {
    const { type, value } = body;

    let isTaken = false;
    if (type === "phone") {
        isTaken = await onboardingRepository.isPhoneTaken(value);
    } else {
        isTaken = await onboardingRepository.isStoreNameTaken(value);
    }

    return jsonSuccess({ available: !isTaken });
});
