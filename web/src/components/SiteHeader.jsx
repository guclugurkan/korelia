// src/components/SiteHeader.jsx
import HeaderDesktop from "./HeaderDesktop.jsx";
import HeaderMobile from "./HeaderMobile.jsx";
import "./SiteHeader.css"; // classes utilitaires

export default function SiteHeader() {
  return (
    <>
      <div className="header-visible-desktop">
        <HeaderDesktop />
      </div>
      <div className="header-visible-mobile">
        <HeaderMobile />
      </div>
    </>
  );
}
