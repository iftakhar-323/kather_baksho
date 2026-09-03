import { useState } from "react";
import { resolveAvatar, avatarFor } from "../utils/avatar";

// Round user avatar. Renders `user.avatar_url` when set and loadable,
// otherwise a deterministic generated avatar (offline SVG).
//
// Usage:
//   <Avatar user={someUser} size={40} />
//   <Avatar name="Sara Khan" email="sara@x.com" size={28} />
export default function Avatar({
  user,
  name,
  email,
  src,
  size = 36,
  ring = false,
  className = "",
  title,
}) {
  const [failed, setFailed] = useState(false);

  const person = user || { name, email, avatar_url: src };
  const generated = avatarFor(person.email || email || "", person.name || name || "");
  const resolved = failed ? generated : resolveAvatar(person);
  const alt = person.name || name || person.email || email || "User";

  return (
    <img
      src={resolved}
      alt={alt}
      title={title || alt}
      width={size}
      height={size}
      onError={() => setFailed(true)}
      draggable={false}
      className={`kb-avatar${ring ? " kb-avatar-ring" : ""} ${className}`.trim()}
      style={{ width: size, height: size }}
    />
  );
}
