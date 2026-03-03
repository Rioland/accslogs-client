"use client";

import TopBar from "../components/TopBar";
import Navbar1 from "../components/Navbar1";
import Footer from "../components/Footer";
import Wrapper from "../components/Wrapper";
import AnimatedSection from "../components/AnimatedSection";

const faqs = [
  {
    q: "1. Can I purchase products using cryptocurrency?",
    a: "Unfortunately, we do not currently accept cryptocurrency. However, we're working on introducing these methods in the near future. In the meantime, you can make a purchase using our payment gateway.",
  },
  {
    q: "2. How do I log into a 2FA account?",
    a: "To log into a 2FA account, visit www.2fa.live and enter your key to receive the verification code.",
  },
  {
    q: "3. How do I log in using cookies?",
    a: null,
    list: {
      type: "ol" as const,
      items: [
        "Visit www.base64encode.org",
        "Select 'Decode'",
        "Paste the cookies",
        "Obtain the decoded JSON cookies",
        "Paste the JSON cookies into your browser to log in.",
      ],
      prefix: "Our cookies are encoded in base64. To use them:",
    },
  },
  {
    q: "4. My account was banned after a successful login. Why?",
    a: null,
    list: {
      type: "ul" as const,
      items: [
        "Clear your browser history.",
        "Match the account's timezone.",
        "Use clean Socks5 or HTTP proxy (preferably mobile proxy). Avoid residential proxies to reduce the risk of account bans.",
        "After logging in, avoid changing the password immediately. We recommend waiting 24 hours or more.",
      ],
      prefix: "Please ensure you follow these steps before logging in:",
    },
  },
  {
    q: "5. Are your accounts handmade?",
    a: "Absolutely! Our accounts are entirely handmade. Our experienced team utilizes the latest devices to ensure top-quality accounts.",
  },
  {
    q: "6. Can I place custom orders?",
    a: "Definitely! Just let us know your specific requirements, and we'll cater to them. Please note, custom orders might be priced higher than our standard offerings.",
  },
  {
    q: "7. Do you accept bulk orders?",
    a: "Yes, we welcome bulk pre-orders. Get in touch via live chat or the ticket section for details.",
  },
  {
    q: "8. What is your refund policy?",
    a: "All our accounts come with a 3 hours guarantee, valid until you log in or start working with them. If issues arise after usage, refunds will not be granted.",
  },
];

const delays = [0, 100, 200, 300, 400, 500, 600, 600] as const;

export default function FAQ() {
  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />
      <Navbar1 />
      <main className="flex-grow py-10">
        <Wrapper>
          <AnimatedSection animation="fade-down" className="text-center mb-8">
            <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>
          </AnimatedSection>

          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <AnimatedSection
                key={faq.q}
                animation="fade-up"
                delay={delays[Math.min(i, delays.length - 1)]}
              >
                <div>
                  <h2 className="text-xl font-semibold mb-2">{faq.q}</h2>
                  {faq.a && <p>{faq.a}</p>}
                  {faq.list && (
                    <>
                      <p>{faq.list.prefix}</p>
                      {faq.list.type === "ol" ? (
                        <ol className="list-decimal list-inside ml-4 mt-1">
                          {faq.list.items.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ol>
                      ) : (
                        <ul className="list-disc list-inside ml-4 mt-1">
                          {faq.list.items.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </div>
              </AnimatedSection>
            ))}
          </div>
        </Wrapper>
      </main>
      <Footer />
    </div>
  );
}
