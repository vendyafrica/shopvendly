import { HugeiconsIcon } from "@hugeicons/react";
import {
  MetaIcon,
  TiktokIcon,
  InstagramIcon,
} from "@hugeicons/core-free-icons";

export function Integrations() {
  return (
    <section>
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="space-y-6 text-center">
          <h2 className="text-foreground text-2xl font-semibold">
            Integrate with your favorite platforms{" "}
          </h2>
          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8 pt-4 md:pt-6 text-sm text-primary/90 drop-shadow-md">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={MetaIcon} size={24} />
              <span className="font-semibold">Meta Business</span>
            </div>
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={InstagramIcon} size={24} />
              <span className="font-semibold">Instagram Shopping</span>
            </div>
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={TiktokIcon} size={24} />
              <span className="font-semibold">TikTok Marketing</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
