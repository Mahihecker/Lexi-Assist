export default function Contact() {
    return (
      <div className="min-h-screen bg-[var(--legal-cream)] flex flex-col items-center justify-center px-6">
        <h1 className="text-4xl font-bold text-[var(--legal-ink)] mb-4">Contact Us</h1>
        <p className="text-lg text-[var(--legal-ink)]/80 mb-6 max-w-xl text-center">
          Have questions or feedback? We'd love to hear from you.
        </p>
        <form className="w-full max-w-md space-y-4">
          <input
            type="text"
            placeholder="Your Name"
            className="w-full px-4 py-3 border border-[var(--legal-border)] rounded-lg bg-white focus:ring-2 focus:ring-[var(--legal-gold)] focus:border-transparent outline-none text-black"
          />
          <input
            type="email"
            placeholder="Your Email"
            className="w-full px-4 py-3 border border-[var(--legal-border)] rounded-lg bg-white focus:ring-2 focus:ring-[var(--legal-gold)] focus:border-transparent outline-none text-black"
          />
          <textarea
            placeholder="Your Message"
            rows={4}
            className="w-full px-4 py-3 border border-[var(--legal-border)] rounded-lg bg-white focus:ring-2 focus:ring-[var(--legal-gold)] focus:border-transparent outline-none text-black"
          />
          <button
            type="submit"
            className="w-full bg-[var(--legal-gold)] text-white py-3 rounded-lg text-lg font-semibold hover:bg-[var(--legal-gold-hover)] transition-colors shadow-md"
          >
            Send Message
          </button>
        </form>
      </div>
    );
  }
  