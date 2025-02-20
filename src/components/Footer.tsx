// Footer Component
import Link from 'next/link';
import { FaFacebook, FaInstagram, FaTwitter } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="bg-[#43286D] text-white py-8 px-6 md:px-12">
      <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* About Section */}
        <div>
          <h3 className="font-bold text-lg">About Rusholme Rendunks</h3>
          <p className="mt-2 text-sm">
            Rendunks is an official team store offering premium jerseys, warm-up
            gear, and basketball essentials. Inspired by champions, designed for
            players and fans alike.
          </p>
          <Link
            href="/about"
            className="text-yellow-400 text-sm mt-2 inline-block"
          >
            Learn More
          </Link>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="font-bold text-lg">Quick Links</h3>
          <ul className="mt-2 space-y-2 text-sm">
            <li>
              <Link href="/shop" className="hover:text-yellow-400">
                Shop
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-yellow-400">
                Contact Us
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-yellow-400">
                About Us
              </Link>
            </li>
          </ul>
        </div>

        {/* Social Media */}
        <div>
          <h3 className="font-bold text-lg">Follow Us</h3>
          <div className="flex space-x-4 mt-2">
            <a href="#" className="hover:text-yellow-400">
              <FaFacebook size={20} />
            </a>
            <a href="#" className="hover:text-yellow-400">
              <FaInstagram size={20} />
            </a>
            <a href="#" className="hover:text-yellow-400">
              <FaTwitter size={20} />
            </a>
          </div>
        </div>
      </div>
      <p className="text-center text-xs mt-6">
        &copy; 2025 Rusholme Rendunks. All rights reserved.
      </p>
    </footer>
  );
}
