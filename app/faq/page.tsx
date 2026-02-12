"use client"

import TopBar from "../components/TopBar";
import Navbar1 from "../components/Navbar1";
import Footer from "../components/Footer";
import Wrapper from "../components/Wrapper";

export default function FAQ() {
  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />
      <Navbar1 />
      <main className="flex-grow py-10">
        <Wrapper>
          <h1 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h1>
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">1. Can I purchase products using cryptocurrency?</h2>
              <p>Unfortunately, we do not currently accept cryptocurrency. However, we&apos;re working on introducing these methods in the near future. In the meantime, you can make a purchase using our payment gateway.</p>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">2. How do I log into a 2FA account?</h2>
              <p>To log into a 2FA account, visit www.2fa.live and enter your key to receive the verification code.</p>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">3. How do I log in using cookies?</h2>
              <p>Our cookies are encoded in base64. To use them:</p>
              <ol className="list-decimal list-inside ml-4">
                <li>Visit www.base64encode.org</li>
                <li>Select &apos;Decode&apos;</li>
                <li>Paste the cookies</li>
                <li>Obtain the decoded JSON cookies</li>
                <li>Paste the JSON cookies into your browser to log in.</li>
              </ol>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">4. My account was banned after a successful login. Why?</h2>
              <p>Please ensure you follow these steps before logging in:</p>
              <ul className="list-disc list-inside ml-4">
                <li>Clear your browser history.</li>
                <li>Match the account&apos;s timezone.</li>
                <li>Use clean Socks5 or HTTP proxy (preferably mobile proxy). Avoid residential proxies to reduce the risk of account bans.</li>
                <li>After logging in, avoid changing the password immediately. We recommend waiting 24 hours or more.</li>
              </ul>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">5. Are your accounts handmade?</h2>
              <p>Absolutely! Our accounts are entirely handmade. Our experienced team utilizes the latest devices to ensure top-quality accounts.</p>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">6. Can I place custom orders?</h2>
              <p>Definitely! Just let us know your specific requirements, and we&apos;ll cater to them. Please note, custom orders might be priced higher than our standard offerings.</p>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">7. Do you accept bulk orders?</h2>
              <p>Yes, we welcome bulk pre-orders. Get in touch via live chat or the ticket section for details.</p>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">8. What is your refund policy?</h2>
              <p>All our accounts come with a 3 hours guarantee, valid until you log in or start working with them. If issues arise after usage, refunds will not be granted.</p>
            </div>
          </div>
        </Wrapper>
      </main>
      <Footer />
    </div>
  );
}
