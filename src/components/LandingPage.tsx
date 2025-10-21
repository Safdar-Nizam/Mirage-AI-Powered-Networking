import { Network, Users, MessageCircle, Shield } from 'lucide-react';

type LandingPageProps = {
  onGetStarted: () => void;
};

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className="w-8 h-8 text-[#008080]" />
            <span className="text-2xl font-bold text-[#008080]">Mirage</span>
          </div>
          <button
            onClick={onGetStarted}
            className="px-6 py-2 bg-[#FF7A00] text-white rounded-lg hover:bg-[#E66E00] transition-colors font-medium"
          >
            Get Started
          </button>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Keep your network alive with AI-assisted connections
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
          Never lose touch with your professional contacts. Visualize your network, schedule catch-ups,
          and build long-term opportunity flow with transparency and consent.
        </p>
        <button
          onClick={onGetStarted}
          className="px-8 py-4 bg-[#FF7A00] text-white rounded-lg hover:bg-[#E66E00] transition-colors font-medium text-lg"
        >
          Start Building Your Network
        </button>

        <div className="mt-16 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-[#008080] rounded-full"></div>
          </div>
          <svg className="w-full max-w-2xl mx-auto" viewBox="0 0 600 400">
            <circle cx="300" cy="200" r="80" fill="none" stroke="#008080" strokeWidth="1" opacity="0.3" />
            <circle cx="300" cy="200" r="140" fill="none" stroke="#FF7A00" strokeWidth="1" opacity="0.3" />
            <circle cx="300" cy="200" r="200" fill="none" stroke="#98A2B3" strokeWidth="1" opacity="0.3" />

            <circle cx="300" cy="200" r="8" fill="#006D6D" />

            <circle cx="380" cy="180" r="6" fill="#008080" />
            <circle cx="220" cy="160" r="6" fill="#008080" />
            <circle cx="340" cy="250" r="6" fill="#008080" />
            <circle cx="260" cy="240" r="6" fill="#008080" />

            <circle cx="440" cy="140" r="5" fill="#FF7A00" />
            <circle cx="160" cy="120" r="5" fill="#FF7A00" />
            <circle cx="420" cy="280" r="5" fill="#FF7A00" />
            <circle cx="180" cy="280" r="5" fill="#FF7A00" />

            <circle cx="500" cy="100" r="4" fill="#98A2B3" />
            <circle cx="100" cy="100" r="4" fill="#98A2B3" />
            <circle cx="480" cy="320" r="4" fill="#98A2B3" />
            <circle cx="120" cy="300" r="4" fill="#98A2B3" />

            <line x1="300" y1="200" x2="380" y2="180" stroke="#008080" strokeWidth="1" opacity="0.4" />
            <line x1="300" y1="200" x2="220" y2="160" stroke="#008080" strokeWidth="1" opacity="0.4" />
            <line x1="300" y1="200" x2="340" y2="250" stroke="#008080" strokeWidth="1" opacity="0.4" />
            <line x1="300" y1="200" x2="260" y2="240" stroke="#008080" strokeWidth="1" opacity="0.4" />
            <line x1="380" y1="180" x2="440" y2="140" stroke="#FF7A00" strokeWidth="1" opacity="0.3" />
            <line x1="220" y1="160" x2="160" y2="120" stroke="#FF7A00" strokeWidth="1" opacity="0.3" />
          </svg>
        </div>
      </section>

      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#008080] rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Import Contacts</h3>
              <p className="text-gray-600">
                Add your professional contacts and organize them by category and connection strength
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#008080] rounded-full flex items-center justify-center mx-auto mb-4">
                <Network className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">2. Visualize Your Network</h3>
              <p className="text-gray-600">
                See your connections in a beautiful interactive graph organized by layers and categories
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#008080] rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Stay Connected</h3>
              <p className="text-gray-600">
                Get reminders and AI-assisted message drafts to reconnect with your network
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Features</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="flex gap-4">
              <Network className="w-6 h-6 text-[#008080] flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Interactive Graph View</h3>
                <p className="text-gray-600">Visualize your network in layers with zoom, pan, and category filtering</p>
              </div>
            </div>
            <div className="flex gap-4">
              <MessageCircle className="w-6 h-6 text-[#008080] flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">AI-Assisted Catch-ups</h3>
                <p className="text-gray-600">Generate personalized message drafts to reconnect with contacts</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Shield className="w-6 h-6 text-[#008080] flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Consent-First Approach</h3>
                <p className="text-gray-600">Contacts opt-in to receive messages with full transparency and control</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Users className="w-6 h-6 text-[#008080] flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Smart Organization</h3>
                <p className="text-gray-600">Categorize contacts and track warmth status automatically</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#008080] text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to grow your professional network?</h2>
          <p className="text-xl mb-8 text-[#E0F2F1]">
            Join Mirage today and never lose touch with valuable connections
          </p>
          <button
            onClick={onGetStarted}
            className="px-8 py-4 bg-[#FF7A00] text-white rounded-lg hover:bg-[#E66E00] transition-colors font-medium text-lg"
          >
            Get Started Free
          </button>
        </div>
      </section>

      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
          <p>&copy; 2025 Mirage. Building meaningful professional connections.</p>
        </div>
      </footer>
    </div>
  );
}
