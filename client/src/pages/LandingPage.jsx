import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Share2, Compass, BadgeCheck, Users, HelpCircle, Star, ArrowRight, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80 } }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-brand-500/10 blur-[150px] dark:bg-brand-500/5"></div>
      <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[120px] dark:bg-emerald-500/5"></div>

      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-4 pt-16 pb-20 sm:px-6 lg:px-8 lg:pt-24 lg:pb-28">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3.5 py-1.5 text-xs font-bold text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 mb-6 border border-brand-100/50 dark:border-brand-900/30">
            <span className="flex h-2 w-2 rounded-full bg-accent-green animate-pulse"></span>
            <span>EXCLUSIVE FOR COLLEGE STUDENTS</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl md:text-6xl max-w-4xl mx-auto leading-none">
            Student Carpool Network
          </h1>
          <p className="mt-3 text-4xl font-extrabold tracking-tight bg-gradient-to-r from-brand-600 via-brand-500 to-emerald-500 bg-clip-text text-transparent dark:from-brand-400 sm:text-5xl md:text-6xl">
            Travel together. Save fuel. Save money.
          </p>

          <p className="mx-auto mt-6 max-w-2xl text-base text-slate-500 dark:text-slate-400 md:text-lg">
            Connect with verified classmates, share bike or car seats daily, split fuel expenses easily via UPI, and build a safer, greener student community.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to="/auth"
              className="group flex items-center gap-2 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-500 px-8 py-4 text-base font-bold text-white shadow-xl shadow-brand-500/20 hover:from-brand-500 hover:to-brand-600 hover:shadow-2xl hover:shadow-brand-500/30 transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <span>Find a Ride</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/auth"
              className="rounded-2xl border border-slate-200 bg-white/80 px-8 py-4 text-base font-bold text-slate-700 shadow-premium dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-850 hover:bg-slate-50 transition-all duration-200"
            >
              Post a Ride
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Floating App Preview Statistics */}
      <section className="relative mx-auto max-w-6xl px-4 pb-20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="grid grid-cols-2 gap-4 sm:grid-cols-4 rounded-3xl p-6 glass-card border border-slate-200/50 dark:border-slate-800/40"
        >
          {[
            { value: '5,000+', label: 'Verified Students', color: 'text-brand-500' },
            { value: '12,000L+', label: 'Fuel Saved', color: 'text-emerald-500' },
            { value: '₹4.5L+', label: 'Travel Cost Saved', color: 'text-brand-500' },
            { value: '4.9/5 ⭐', label: 'Average Ride Rating', color: 'text-yellow-500' }
          ].map((stat, i) => (
            <div key={i} className="text-center p-4">
              <span className={`block text-3xl font-extrabold ${stat.color}`}>{stat.value}</span>
              <span className="text-xs font-semibold text-slate-400 mt-1 block uppercase tracking-wider">{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* How it Works Section */}
      <section className="bg-slate-50 py-20 dark:bg-slate-900/30 border-y border-slate-100 dark:border-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">Easy Sharing</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              How CampusRide Works
            </p>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3"
          >
            {[
              {
                step: '01',
                title: 'Verify & Sign In',
                desc: 'Sign up using your college email address. Our platform automatically restricts memberships to verified students of specific colleges for safety.',
                icon: BadgeCheck,
                color: 'bg-blue-500/10 text-blue-500'
              },
              {
                step: '02',
                title: 'Post or Find Rides',
                desc: 'Create flexible schedules (single trips, weekly recurrence, or custom calendar dates). Passengers search routes and join empty seats.',
                icon: Share2,
                color: 'bg-emerald-500/10 text-emerald-500'
              },
              {
                step: '03',
                title: 'Share UPI & Ride',
                desc: 'Chat via our safe message board, align on the landmark pickup spot, verify credentials, and pay the fuel contribution directly via UPI.',
                icon: Compass,
                color: 'bg-brand-500/10 text-brand-500'
              }
            ].map((card, i) => (
              <motion.div 
                key={i} 
                variants={itemVariants}
                className="relative rounded-3xl p-8 glass-card border border-white hover:shadow-premium-hover transition-all duration-300"
              >
                <span className="absolute top-6 right-8 text-4xl font-extrabold text-slate-200 dark:text-slate-800/80">{card.step}</span>
                <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${card.color} mb-6`}>
                  <card.icon size={24} />
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{card.title}</h3>
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{card.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Safety & Trust Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">Safety First</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              100% Student-Only Security
            </p>
            <p className="mt-4 text-base text-slate-500 dark:text-slate-400 leading-relaxed">
              We understand campus commuting safety is paramount. Unlike standard taxi networks, CampusRide operates strictly as a peer-to-peer student commute network.
            </p>
            
            <div className="mt-8 space-y-6">
              {[
                { title: 'College Domain Email Lock', desc: 'Accounts require verification using active institution emails (e.g., student@iitb.ac.in).' },
                { title: 'Emergency Contact & Support', desc: 'Direct access to institutional guards, emergency contacts, and ride-sharing logs.' },
                { title: 'Peer Review & Suspension', desc: 'We ban reported accounts, eliminate fake profiles, and enforce vehicle registration verification.' }
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                    <Shield size={18} />
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative rounded-3xl overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-600 to-emerald-500 opacity-10"></div>
            <img 
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=600&auto=format&fit=crop" 
              alt="Students traveling together" 
              className="object-cover w-full h-[400px]"
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-slate-50 py-20 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">User Reviews</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              What Students Are Saying
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                quote: "CampusRide saved my life! Commuting from Ghatkopar to IIT Bombay was draining my pocket. Now I join Aarav's carpool. We split fuel and I save ₹2,000 every month!",
                author: "Rohan Verma",
                role: "Passenger, B.Tech IITB",
                stars: 5,
                seed: 'Rohan'
              },
              {
                quote: "I hate driving alone to DU every day. By hosting a weekly schedule on CampusRide, I find sweet classmates traveling along my lane. Highly recommended app!",
                author: "Sneha Patel",
                role: "Driver, Delhi University",
                stars: 5,
                seed: 'Sneha'
              },
              {
                quote: "The calendar options are top-notch. I can remove university holiday weeks or exam study days from my schedule in seconds. Extremely flexible scheduling system.",
                author: "Ananya Iyer",
                role: "Driver, M.Des IITB",
                stars: 4,
                seed: 'Ananya'
              }
            ].map((t, i) => (
              <div key={i} className="rounded-3xl p-8 glass-card border border-white flex flex-col justify-between">
                <div>
                  <div className="flex gap-0.5 text-yellow-500 mb-4">
                    {[...Array(5)].map((_, s) => (
                      <Star key={s} size={15} fill={s < t.stars ? 'currentColor' : 'none'} />
                    ))}
                  </div>
                  <p className="text-sm italic text-slate-600 dark:text-slate-300 leading-relaxed">"{t.quote}"</p>
                </div>
                <div className="mt-6 flex items-center gap-3 border-t border-slate-100 dark:border-slate-800/50 pt-4">
                  <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${t.seed}`} alt={t.author} className="h-9 w-9 rounded-full bg-slate-100" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{t.author}</h4>
                    <span className="text-[10px] text-slate-400 font-semibold">{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mx-auto max-w-4xl px-4 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-slate-500 dark:text-slate-400">Got questions? We have answers.</p>
        </div>

        <div className="mt-12 space-y-4">
          {[
            { q: "Is this service restricted to students?", a: "Yes. Our platform enforces login using verified institutional student emails. Non-students are blocked from creating profiles." },
            { q: "How are payments handled?", a: "We provide an integrated UPI payment gateway placeholder. You scan the driver's UPI QR code or send payment directly to their UPI ID once they approve your booking." },
            { q: "Can I cancel a specific day in a weekly schedule?", a: "Yes. Our calendar-based exclusion lets you cancel tomorrow's ride without affecting your general recurring schedule." },
            { q: "How do live seat updates work?", a: "When you accept bookings, seats decrease automatically. Driver can also manually update remaining seats (e.g. green indicator for empty, yellow for 1 left, red for full)." }
          ].map((item, i) => (
            <details key={i} className="group rounded-2xl border border-slate-200 dark:border-slate-800 p-5 [&_summary::-webkit-details-marker]:hidden bg-white/50 dark:bg-slate-900/50">
              <summary className="flex cursor-pointer items-center justify-between text-slate-800 dark:text-slate-200">
                <h3 className="text-sm font-bold">{item.q}</h3>
                <span className="shrink-0 rounded-full bg-slate-100 p-1 text-slate-400 group-open:rotate-180 dark:bg-slate-800 dark:text-slate-500 transition-all duration-300">
                  <HelpCircle size={16} />
                </span>
              </summary>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/50 pt-3">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-900 bg-slate-50 py-12 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center gap-2 items-center mb-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white font-bold">CR</span>
            <span className="font-bold text-slate-800 dark:text-slate-100">CampusRide Platform</span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            © {new Date().getFullYear()} CampusRide. Created by Google DeepMind pairs. Peer carpool for verified students. Not a taxi booking system.
          </p>
        </div>
      </footer>
    </div>
  );
}
