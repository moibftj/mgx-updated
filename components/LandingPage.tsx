import React from "react";
import { ShimmerButton } from "./magicui/shimmer-button";
import { ShinyButton } from "./magicui/shiny-button";
import { SparklesText } from "./magicui/sparkles-text";
import { Spotlight } from "./magicui/spotlight";
import { GradientButton } from "./ui/gradient-button";
import { Logo } from "./Logo";
import { IconLogo, IconFilePlus, IconUsers, IconStar } from "../constants";

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onLogin,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200">
      {/* Hero Section with Geometric Design */}
      <div className="relative">
        {/* Navigation overlay */}
        <nav className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 sm:p-6 lg:p-8">
          <Logo size="md" showText={true} variant="light" />

          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={onLogin}
              className="text-sm sm:text-base font-medium text-white/80 hover:text-white transition-colors"
            >
              Sign In
            </button>
            <ShimmerButton
              onClick={onGetStarted}
              className="h-8 sm:h-9 md:h-10 px-3 sm:px-4 md:px-6 text-xs sm:text-sm md:text-base"
            >
              Get Started
            </ShimmerButton>
          </div>
        </nav>

        {/* Hero Section */}
        <Spotlight className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-gray-950 to-slate-900">
          <div className="text-center z-10 px-4">
            <div className="mb-4">
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-blue-600/20 text-blue-400 text-sm font-medium">
                ⚖️ Talk to My Lawyer
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-white mb-6">
              <SparklesText>Generate Legal Letters</SparklesText>
              <br />
              <span className="text-blue-400">with AI Power</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mb-8">
              Professional AI-generated legal documents in minutes. Save time,
              reduce costs, and ensure accuracy.
            </p>
          </div>
        </Spotlight>

        {/* Call to Action overlay */}
        <div className="absolute bottom-20 left-0 right-0 z-50">
          <div className="max-w-3xl mx-auto text-center px-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              <GradientButton
                onClick={onGetStarted}
                className="w-full sm:w-auto h-12 lg:h-14 px-8 lg:px-12 text-sm lg:text-lg font-semibold"
              >
                Start Creating Letters
              </GradientButton>

              <GradientButton
                onClick={onLogin}
                variant="variant"
                className="w-full sm:w-auto h-12 lg:h-14 px-8 lg:px-12 text-sm lg:text-lg font-semibold"
              >
                Already have an account?
              </GradientButton>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 sm:py-24 lg:py-32 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16 lg:mb-20">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose Talk to My Lawyer?
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Professional legal document creation made simple, fast, and
              affordable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <IconFilePlus className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                AI-Powered Generation
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Our cutting-edge AI technology creates professional legal
                letters tailored specifically to your unique situation and
                requirements.
              </p>
              <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                <li>• Smart text generation</li>
                <li>• Context-aware content</li>
                <li>• Professional formatting</li>
                <li>• Legal accuracy checks</li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <IconUsers className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Multiple Templates</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Access a wide variety of legal document templates designed by
                legal professionals for different situations.
              </p>
              <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                <li>• Demand letters</li>
                <li>• Cease & desist notices</li>
                <li>• Recommendation letters</li>
                <li>• Custom templates</li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <IconStar className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy to Use</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Simple, form-based interface that makes creating professional
                legal documents accessible to everyone, regardless of legal
                background.
              </p>
              <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                <li>• Step-by-step guidance</li>
                <li>• Form-based input</li>
                <li>• Instant preview</li>
                <li>• One-click generation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-16 sm:py-24 lg:py-32 bg-slate-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16 lg:mb-20">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Get your legal letter in three simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
            {/* Step 1 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 dark:bg-blue-500 rounded-full text-white font-bold text-lg sm:text-xl mb-4 sm:mb-6">
                1
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                Choose Template
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                Select from our comprehensive library of legal letter templates.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 dark:bg-blue-500 rounded-full text-white font-bold text-lg sm:text-xl mb-4 sm:mb-6">
                2
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                Fill Details
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                Provide the specific information and context for your situation.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 dark:bg-blue-500 rounded-full text-white font-bold text-lg sm:text-xl mb-4 sm:mb-6">
                3
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                Generate & Download
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                AI creates your professional letter instantly. Download as PDF
                or send via email.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 sm:py-24 lg:py-32 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6">
            Ready to Create Your Legal Letter?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-blue-100 dark:text-blue-200 mb-8 sm:mb-12">
            Join thousands of users who trust Talk to My Lawyer for their legal
            document needs.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <ShimmerButton
              onClick={onGetStarted}
              className="w-full sm:w-auto h-10 sm:h-12 lg:h-14 px-6 sm:px-8 lg:px-12 text-sm sm:text-base lg:text-lg font-semibold bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Get Started Now
            </ShimmerButton>

            <button
              onClick={onLogin}
              className="w-full sm:w-auto h-10 sm:h-12 lg:h-14 px-6 sm:px-8 lg:px-12 text-sm sm:text-base lg:text-lg font-semibold text-white border-2 border-white/30 hover:border-white/50 rounded-lg transition-all duration-200 hover:bg-white/10"
            >
              Already have an account?
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 sm:py-12 bg-gray-900 dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <IconLogo className="h-6 w-6 text-blue-400" />
              <span className="text-lg font-semibold text-white">
                Talk to My Lawyer
              </span>
            </div>
            <p className="text-sm text-gray-400">
              © 2024 Talk to My Lawyer. Professional legal document generation
              powered by AI.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
