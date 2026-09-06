import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="siteHeader">
      <Link href="/" className="brandMark">
        Observatoire <span>Planète</span>
      </Link>
      <nav className="siteNav" aria-label="Navigation principale">
        <Link href="/comparer">Comparer</Link>
        <Link href="/naissance">Naissance</Link>
        <Link href="/meteo/auvergne-rhone-alpes/isere/grenoble">Grenoble</Link>
        <Link href="/meteo/auvergne-rhone-alpes/isere/crolles">Crolles</Link>
        <Link href="/meteo/auvergne-rhone-alpes/isere/la-pierre">La Pierre</Link>
        <Link href="/sources">Sources</Link>
        <Link href="/methodology">Méthode</Link>
      </nav>
    </header>
  );
}
