import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="siteHeader">
      <Link href="/" className="brandMark">
        Observatoire <span>Planète</span>
      </Link>
      <nav>
        <Link href="/weather/france/auvergne-rhone-alpes/isere/grenoble">Grenoble</Link>
        <Link href="/weather/france/auvergne-rhone-alpes/isere/crolles">Crolles</Link>
        <Link href="/weather/france/auvergne-rhone-alpes/isere/la-pierre">La Pierre</Link>
        <Link href="/sources">Sources</Link>
        <Link href="/methodology">Méthode</Link>
        <Link href="/dashboard">Prototype</Link>
      </nav>
    </header>
  );
}
