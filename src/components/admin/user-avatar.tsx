/* eslint-disable @next/next/no-img-element -- Google avatar URLs vary by host; tiny images, no optimization needed. */
import { initials } from './format';

export function UserAvatar({ name, image, size = 32 }: { name: string; image: string | null; size?: number }) {
  return image ? (
    <img src={image} alt="" width={size} height={size} referrerPolicy="no-referrer" className="shrink-0 rounded-full border border-border object-cover" style={{ width: size, height: size }} />
  ) : (
    <span aria-hidden className="flex shrink-0 items-center justify-center rounded-full border border-border bg-surface text-[10px] text-muted-foreground" style={{ width: size, height: size }}>
      {initials(name)}
    </span>
  );
}
