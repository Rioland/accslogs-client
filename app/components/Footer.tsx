import FooterBrand from "./FooterBrand";
import FooterLinks from "./FooterLinks";
import NewsletterForm from "./NewsletterForm";
import Wrapper from "./Wrapper";

export default function Footer() {
  return (
    <footer className="bg-white border-t py-4">
      <Wrapper>
        <div className=" grid gap-10 md:grid-cols-3">
          <FooterBrand />
          <FooterLinks />
          <NewsletterForm />
        </div>
      </Wrapper>
      <div className="bg-[#194572]">
        <Wrapper>
          <div className="flex flex-col items-center gap-3 py-5 text-center text-sm text-white/95 sm:flex-row sm:justify-between sm:text-left">
            <p>© 2026 Topnotchlogs. All rights reserved.</p>
            <p className="text-white/90">Developed by riotech</p>
            <p>Copying is prohibited!</p>
          </div>
        </Wrapper>
      </div>
    </footer>
  );
}
