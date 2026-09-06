import Image from "next/image";
import type { ReactNode } from "react";

export default function PageBanner({
  image,
  eyebrow,
  title,
  lead,
  children
}: {
  image: string;
  eyebrow: string;
  title: ReactNode;
  lead: string;
  children?: ReactNode;
}) {
  return (
    <section className="pageBanner">
      <Image src={image} alt="" fill priority sizes="100vw" />
      <div className="pageBannerContent">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{lead}</p>
        {children}
      </div>
    </section>
  );
}
