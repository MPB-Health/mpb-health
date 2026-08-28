import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';
import './landing-redesign.css';

export function LandingFooter() {
  return (
    <footer className="lr-footer">
      <div className="lr-footer__hairline" />
      <div className="lr-inner">
        <div className="lr-footer__top">
          <div>
            <div className="lr-footer__brand">
              <img
                className="lr-footer__logo"
                src="/assets/brand/mpb-wordmark-white.png"
                alt="MPB Health"
                width={706}
                height={204}
                decoding="async"
                loading="lazy"
              />
            </div>
            <a
              className="lr-footer__bbb"
              href="https://www.bbb.org/us/fl/boca-raton/profile/health-insurance/mpowering-benefits-inc-0633-92042549/#sealclick"
              target="_blank"
              rel="nofollow noopener noreferrer"
            >
              <img
                src="https://seal-seflorida.bbb.org/seals/blue-seal-200-42-bbb-92042549.png"
                alt="MPowering Benefits Inc. BBB Business Review"
                width={200}
                height={42}
                loading="lazy"
                decoding="async"
              />
            </a>
          </div>
          <p className="lr-footer__disclaimer">
            MPB Health is your gateway to qualified Health Share Programs. While MPB Health is not a
            Health Share Organization or a Health Care Sharing Ministry (HCSM), we provide the
            membership services and support that give you access to organizations that share in
            members medical expenses. Through MPB Health, you can experience affordable,
            community-based healthcare that works as an alternative to traditional insurance.
          </p>
        </div>

        <div className="lr-footer__grid">
          <div>
            <h4 className="lr-footer__heading">Contact Us</h4>
            <address
              className="not-italic"
              itemScope
              itemType="https://schema.org/MedicalOrganization"
            >
              <div className="lr-footer__row">
                <Phone />
                <a href="tel:+18558164650" itemProp="telephone">
                  (855) 816-4650
                </a>
              </div>
              <div className="lr-footer__row">
                <Mail />
                <a href="mailto:info@mympb.com" itemProp="email">
                  info@mympb.com
                </a>
              </div>
              <div className="lr-footer__row">
                <MapPin />
                <span itemProp="address" itemScope itemType="https://schema.org/PostalAddress">
                  <span itemProp="streetAddress">5301 N Federal Hwy, Suite 155</span>,{' '}
                  <span itemProp="addressLocality">Boca Raton</span>,{' '}
                  <span itemProp="addressRegion">FL</span>{' '}
                  <span itemProp="postalCode">33487</span>
                </span>
              </div>
            </address>
          </div>

          <div>
            <h4 className="lr-footer__heading">Links</h4>
            <ul className="lr-footer__links">
              <li>
                <Link to="/privacy-policy">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/terms-and-conditions">Terms and Conditions</Link>
              </li>
              <li>
                <Link to="/state-notices">State Notices</Link>
              </li>
              <li>
                <Link to="/washington-statement">Washington Statement</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="lr-footer__heading lr-footer__sr">More</h4>
            <ul className="lr-footer__links">
              <li>
                <Link to="/faq">FAQ</Link>
              </li>
              <li>
                <Link to="/download-app">App Download</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default LandingFooter;
