import { Github, Youtube, Linkedin, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-6 py-10 max-w-6xl">

        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">

          {/* About */}
          <div>
            <h4 className="text-white font-semibold mb-3">StudySaathi</h4>
            <p className="text-sm leading-relaxed">
              StudySaathi is an AI-powered adaptive learning platform designed to
              personalize education for every student and assist teachers in
              multi-level classrooms.
            </p>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white font-semibold mb-3">Contact</h4>
            <div className="space-y-2 text-sm">
              <p className="flex items-center justify-center md:justify-start gap-2">
                <MapPin size={16} />
                PICT College, Dhankawadi, Pune, Maharashtra
              </p>
              <p className="flex items-center justify-center md:justify-start gap-2">
                <Phone size={16} />
                +91 98765 43210
              </p>
            </div>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="text-white font-semibold mb-3">Connect With Us</h4>
            <div className="flex justify-center md:justify-start gap-4">

              <a
                href="https://github.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-lg bg-gray-800 hover:bg-gray-700 hover:text-white transition"
              >
                <Github size={20} />
              </a>

              <a
                href="https://www.youtube.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-lg bg-gray-800 hover:bg-gray-700 hover:text-white transition"
              >
                <Youtube size={20} />
              </a>

              <a
                href="https://www.linkedin.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-lg bg-gray-800 hover:bg-gray-700 hover:text-white transition"
              >
                <Linkedin size={20} />
              </a>

            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 mt-8 pt-4 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} StudySaathi — Personalized Learning for Every Student
        </div>
      </div>
    </footer>
  );
}
