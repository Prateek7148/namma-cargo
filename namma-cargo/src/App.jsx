import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { QRCodeSVG } from 'qrcode.react';
import {
  Truck, Bike, Package, MapPin, Navigation, ShieldCheck,
  IndianRupee, Clock, CheckCircle2, AlertTriangle, RefreshCw,
  UserCheck, QrCode, ArrowRight, Sparkles, PhoneCall, Radio
} from 'lucide-react';

// ============================================================================
// 1. SUPABASE LIVE CLOUD CONNECTION (Connected to your NammaCargo project)
// ============================================================================
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://jfzxpwtuvflnmwjnhdph.supabase.co';
const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_8FQR2H08lxEArRynnpiXOg_W9iLlm9a';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================================================
// 2. BENGALURU HUBS & INDIA FLEET CATEGORIES
// ============================================================================
const BENGALURU_HUBS = [
  { name: 'Avalahalli / Old Madras Rd', zone: 'East Corridor', trafficNote: 'Check Tin Factory / KR Puram merge' },
  { name: 'KR Puram / Tin Factory', zone: 'East', trafficNote: 'Heavy peak-hour bottleneck' },
  { name: 'Whitefield / ITPL Main Rd', zone: 'East Tech & Warehousing', trafficNote: 'Smooth via Hoodi link road' },
  { name: 'Peenya Industrial Area (1st-4th Stage)', zone: 'North-West Industrial', trafficNote: 'Heavy truck corridor via Goraguntepalya' },
  { name: 'Yeshwanthpur APMC Yard', zone: 'North-West Wholesale', trafficNote: 'RMC Yard loading gates busy 8 AM - 12 PM' },
  { name: 'KR Market / Chickpet / SP Road', zone: 'Central Wholesale', trafficNote: 'Narrow lanes: 2W & 3W Cargo Auto preferred' },
  { name: 'Electronic City Phase 1 & 2', zone: 'South Industrial', trafficNote: 'Fast access via Elevated Expressway' },
  { name: 'Bommasandra Industrial Area', zone: 'Deep South Manufacturing', trafficNote: 'Hosur Road commercial corridor' },
  { name: 'Koramangala / HSR Layout', zone: 'South-East Commercial', trafficNote: 'Watch Silk Board Junction congestion' },
  { name: 'Indiranagar / Domlur', zone: 'Central-East Retail', trafficNote: '100 Feet Road commercial loading zones' },
  { name: 'Hebbal / Yelahanka', zone: 'North Corridor', trafficNote: 'Airport Road flyover clear' },
  { name: 'Mysore Road / Kengeri', zone: 'West Corridor', trafficNote: 'NICE Road interchange easy for 4W/6W trucks' }
];

const FLEET_TYPES = [
  {
    id: '2W',
    name: '2W Cargo Bike / Scooter',
    models: 'TVS XL100 Heavy Duty • Activa • Ather Electric',
    maxWeight: 25,
    baseFare: 45,
    perKm: 11,
    badge: '1 - 25 kg',
    color: 'emerald'
  },
  {
    id: '3W',
    name: '3W Cargo Auto (Goods)',
    models: 'Piaggio Ape Xtra • Bajaj Maxima C • Mahindra Treo Zor',
    maxWeight: 500,
    baseFare: 160,
    perKm: 19,
    badge: '26 - 500 kg',
    color: 'amber'
  },
  {
    id: '4W',
    name: '4W Mini Truck (Chota Hathi)',
    models: 'Tata Ace Gold • अशोक Leyland Dost • Mahindra Bolero Pik-Up',
    maxWeight: 1500,
    baseFare: 320,
    perKm: 28,
    badge: '501 - 1,500 kg',
    color: 'blue'
  },
  {
    id: '6W',
    name: '6W+ Heavy Commercial Truck',
    models: 'Eicher Pro 14ft/17ft • Tata 407 • BharatBenz Heavy',
    maxWeight: 10000,
    baseFare: 950,
    perKm: 52,
    badge: '1,501 - 10,000 kg',
    color: 'purple'
  }
];

export default function App() {
  // Mode: 'customer' or 'driver'
  const [mode, setMode] = useState('customer');
  const [cloudConnected, setCloudConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // Live Data from Supabase
  const [bookings, setBookings] = useState([]);
  const [bidsByBooking, setBidsByBooking] = useState({});

  // Customer Form State
  const [customerName, setCustomerName] = useState('Prateek Traders & Hardware');
  const [customerPhone, setCustomerPhone] = useState('9845012345');
  const [pickupHub, setPickupHub] = useState(BENGALURU_HUBS[0].name);
  const [dropHub, setDropHub] = useState(BENGALURU_HUBS[3].name);
  const [cargoType, setCargoType] = useState('Hardware, Boxes & Electrical Goods');
  const [weightKg, setWeightKg] = useState(320);
  const [selectedFleet, setSelectedFleet] = useState('3W');
  const [customFare, setCustomFare] = useState(380);
  const [ewayBill, setEwayBill] = useState('');

  // Driver Profile State (Saved locally for quick demo + sent with every bid/accept)
  const [driverName, setDriverName] = useState('Raju Gowda');
  const [driverVehicle, setDriverVehicle] = useState('KA-53-C-4821 (3W Ape Cargo)');
  const [driverUpi, setDriverUpi] = useState('rajugowda@ybl');
  const [bidInputs, setBidInputs] = useState({});
  const [otpInputs, setOtpInputs] = useState({});
  const [statusMessage, setStatusMessage] = useState('');

  // Auto-select appropriate vehicle & recommended fare when weight or hubs change
  useEffect(() => {
    const autoFleet =
      FLEET_TYPES.find((f) => weightKg <= f.maxWeight) || FLEET_TYPES[FLEET_TYPES.length - 1];
    setSelectedFleet(autoFleet.id);

    const pIdx = BENGALURU_HUBS.findIndex((h) => h.name === pickupHub);
    const dIdx = BENGALURU_HUBS.findIndex((h) => h.name === dropHub);
    const estKm = Math.max(4, Math.abs(pIdx - dIdx) * 4 + 6);
    const estFare = Math.round((autoFleet.baseFare + estKm * autoFleet.perKm) / 10) * 10;
    setCustomFare(estFare);
  }, [weightKg, pickupHub, dropHub]);

  // Fetch initial bookings & bids + subscribe to Supabase Realtime WebSockets
  const fetchLiveCloudData = async () => {
    setLoading(true);
    const { data: bData, error: bErr } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    const { data: bidData } = await supabase
      .from('bids')
      .select('*')
      .order('created_at', { ascending: true });

    if (!bErr && bData) {
      setBookings(bData);
      setCloudConnected(true);
    }

    if (bidData) {
      const grouped = {};
      bidData.forEach((b) => {
        if (!grouped[b.booking_id]) grouped[b.booking_id] = [];
        grouped[b.booking_id].push(b);
      });
      setBidsByBooking(grouped);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLiveCloudData();

    // Subscribe to live inserts/updates on bookings and bids
    const channel = supabase
      .channel('namma-cargo-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => fetchLiveCloudData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bids' },
        () => fetchLiveCloudData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ==========================================================================
  // ACTIONS: Broadcast Load, Bid, Accept, Verify OTP, Complete & Pay via UPI
  // ==========================================================================
  const handleBroadcastLoad = async (e) => {
    e.preventDefault();
    if (pickupHub === dropHub) {
      alert('Please select different Pickup and Drop hubs in Bengaluru.');
      return;
    }
    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();

    const { error } = await supabase.from('bookings').insert([
      {
        customer_name: customerName,
        customer_phone: customerPhone,
        pickup_hub: pickupHub,
        drop_hub: dropHub,
        cargo_type: cargoType,
        weight_kg: Number(weightKg),
        vehicle_category: selectedFleet,
        offered_fare: Number(customFare),
        status: 'broadcasting',
        pickup_otp: generatedOtp,
        eway_bill_no: ewayBill || null
      }
    ]);

    if (error) {
      alert('Error saving booking: ' + error.message);
    } else {
      setStatusMessage('Load broadcasted live to Bengaluru fleet partners!');
      setTimeout(() => setStatusMessage(''), 4000);
      fetchLiveCloudData();
    }
  };

  const handleDriverDirectAccept = async (booking) => {
    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'accepted',
        agreed_fare: booking.offered_fare,
        driver_name: driverName,
        driver_vehicle: driverVehicle,
        driver_upi: driverUpi
      })
      .eq('id', booking.id);

    if (!error) fetchLiveCloudData();
  };

  const handleDriverPlaceBid = async (bookingId) => {
    const amount = Number(bidInputs[bookingId]);
    if (!amount || amount <= 0) {
      alert('Enter a valid counter-bid amount in ₹');
      return;
    }

    const { error } = await supabase.from('bids').insert([
      {
        booking_id: bookingId,
        driver_name: driverName,
        vehicle_number: driverVehicle,
        driver_upi: driverUpi,
        bid_amount: amount
      }
    ]);

    if (!error) {
      setBidInputs({ ...bidInputs, [bookingId]: '' });
      fetchLiveCloudData();
    }
  };

  const handleCustomerAcceptBid = async (bookingId, bid) => {
    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'accepted',
        agreed_fare: bid.bid_amount,
        driver_name: bid.driver_name,
        driver_vehicle: bid.vehicle_number,
        driver_upi: bid.driver_upi
      })
      .eq('id', bookingId);

    if (!error) fetchLiveCloudData();
  };

  const handleVerifyPickupOtp = async (booking) => {
    const entered = (otpInputs[booking.id] || '').trim();
    if (entered !== booking.pickup_otp) {
      alert(`Incorrect OTP! Ask customer for the 4-digit Pickup OTP (Hint: ${booking.pickup_otp})`);
      return;
    }
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'in_transit' })
      .eq('id', booking.id);

    if (!error) fetchLiveCloudData();
  };

  const handleMarkDelivered = async (bookingId) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'delivered' })
      .eq('id', bookingId);

    if (!error) fetchLiveCloudData();
  };

  // Free 1-Tap Google Maps Deep Link for Bengaluru Traffic Navigation
  const openGoogleMaps = (hubName) => {
    const query = encodeURIComponent(`${hubName}, Bengaluru, Karnataka, India`);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${query}&travelmode=driving`, '_blank');
  };

  const selectedPickupObj = BENGALURU_HUBS.find((h) => h.name === pickupHub) || BENGALURU_HUBS[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 text-slate-950 p-2 rounded-xl font-black">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">
                  NAMMA<span className="text-amber-400">CARGO</span>
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 font-semibold">
                  <Radio className="w-3 h-3 animate-pulse" />
                  {cloudConnected ? 'LIVE SUPABASE CLOUD' : 'CONNECTING...'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Bengaluru All-Wheeler Freight Network • 2W • 3W • 4W • 6W+
              </p>
            </div>
          </div>

          {/* DUAL MODE SWITCHER */}
          <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setMode('customer')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                mode === 'customer'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Package className="w-4 h-4" />
              Customer Mode (Book Cargo)
            </button>
            <button
              onClick={() => setMode('driver')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                mode === 'driver'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Truck className="w-4 h-4" />
              Driver / Fleet Partner ({bookings.filter((b) => b.status === 'broadcasting').length})
            </button>
          </div>
        </div>
      </header>

      {/* STATUS BANNER */}
      {statusMessage && (
        <div className="max-w-6xl mx-auto mt-4 px-4">
          <div className="bg-emerald-500/20 border border-emerald-500 text-emerald-200 px-4 py-3 rounded-xl flex items-center justify-between text-sm font-medium">
            <span>{statusMessage}</span>
            <span className="text-xs underline cursor-pointer" onClick={() => setMode('driver')}>
          Switch to Driver Mode to accept →
            </span>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 mt-6">
        {mode === 'customer' ? (
          /* ==================================================================
             CUSTOMER VIEW: CREATE BOOKING + MANAGE LIVE CARGO TRIPS
             ================================================================== */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: BOOKING FORM */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  Broadcast a Cargo Load
                </h2>
                <span className="text-xs text-slate-400">Bengaluru Metro</span>
              </div>

              <form onSubmit={handleBroadcastLoad} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Shipper / Shop Name</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Contact Mobile</label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      required
                    />
                  </div>
                </div>

                {/* PICKUP & DROP */}
                <div>
                  <label className="text-xs text-emerald-400 font-semibold block mb-1">
                    Pickup Location (Bengaluru Hub)
                  </label>
                  <select
                    value={pickupHub}
                    onChange={(e) => setPickupHub(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white"
                  >
                    {BENGALURU_HUBS.map((h) => (
                      <option key={h.name} value={h.name}>
                        {h.name} ({h.zone})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-amber-400/90 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {selectedPickupObj.trafficNote}
                  </p>
                </div>

                <div>
                  <label className="text-xs text-rose-400 font-semibold block mb-1">
                    Drop-Off Destination (Bengaluru Hub)
                  </label>
                  <select
                    value={dropHub}
                    onChange={(e) => setDropHub(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white"
                  >
                    {BENGALURU_HUBS.map((h) => (
                      <option key={h.name} value={h.name}>
                        {h.name} ({h.zone})
                      </option>
                    ))}
                  </select>
                </div>

                {/* CARGO DESCRIPTION & WEIGHT SLIDER */}
                <div>
                  <label className="text-xs text-slate-400 block mb-1">What are you shipping?</label>
                  <input
                    type="text"
                    value={cargoType}
                    onChange={(e) => setCargoType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                    placeholder="e.g. Plywood sheets, Textiles, Spare parts"
                    required
                  />
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-400 font-medium">Approx Cargo Weight:</span>
                    <span className="text-amber-400 font-bold text-sm">{weightKg} kg</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="3000"
                    step="5"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>2W Bike (up to 25kg)</span>
                    <span>3W Auto (500kg)</span>
                    <span>4W Ace (1500kg)</span>
                    <span>6W+ (3000kg+)</span>
                  </div>
                </div>

                {/* AUTO-RECOMMENDED VEHICLE SELECTOR */}
                <div>
                  <label className="text-xs text-slate-400 block mb-2">
                    Select Wheeler Category (Auto-Matched by Weight)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {FLEET_TYPES.map((f) => {
                      const active = selectedFleet === f.id;
                      return (
                        <button
                          type="button"
                          key={f.id}
                          onClick={() => setSelectedFleet(f.id)}
                          className={`p-2.5 rounded-xl border text-left transition ${
                            active
                              ? 'bg-amber-500/15 border-amber-500 text-white'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-black text-sm text-amber-400">{f.id}</span>
                            <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded">
                              {f.badge}
                            </span>
                          </div>
                          <div className="text-xs font-semibold mt-1 truncate">{f.name}</div>
                          <div className="text-[10px] text-slate-500 truncate">{f.models}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* OFFERED FARE & OPTIONAL E-WAY BILL */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">
                      Your Offer Fare (₹ INR)
                    </label>
                    <input
                      type="number"
                      value={customFare}
                      onChange={(e) => setCustomFare(e.target.value)}
                      className="w-full bg-slate-950 border border-amber-500/60 rounded-lg px-3 py-2 text-base font-bold text-amber-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">
                      E-Way Bill No. (Optional)
                    </label>
                    <input
                      type="text"
                      value={ewayBill}
                      onChange={(e) => setEwayBill(e.target.value)}
                      placeholder="12-digit GST E-Way"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  <Truck className="w-5 h-5" />
                  Broadcast Load to Bengaluru Drivers (₹{customFare})
                </button>
              </form>
            </div>

            {/* RIGHT COLUMN: LIVE BOOKINGS & COUNTER-BIDS */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-400" />
                  Your Live Cargo Shipments ({bookings.length})
                </h2>
                <button
                  onClick={fetchLiveCloudData}
                  className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-slate-300"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh Cloud
                </button>
              </div>

              {loading ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
                  Syncing live shipments from Supabase Mumbai Cloud...
                </div>
              ) : bookings.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
                  No active shipments yet. Use the form on the left to broadcast your first Bengaluru cargo load!
                </div>
              ) : (
                bookings.map((b) => {
                  const bids = bidsByBooking[b.id] || [];
                  const upiUri = `upi://pay?pa=${b.driver_upi || 'rajugowda@ybl'}&pn=${encodeURIComponent(
                    b.driver_name || 'NammaCargo Driver'
                  )}&am=${b.agreed_fare || b.offered_fare}&cu=INR&tn=NammaCargo_Freight`;

                  return (
                    <div
                      key={b.id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-black text-xs">
                            {b.vehicle_category}
                          </span>
                          <span className="font-bold text-white text-sm">{b.cargo_type}</span>
                          <span className="text-xs text-slate-400">({b.weight_kg} kg)</span>
                        </div>
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${
                            b.status === 'broadcasting'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : b.status === 'accepted'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                              : b.status === 'in_transit'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          {b.status.replace('_', ' ')}
                        </span>
                      </div>

                      {/* ROUTE DETAILS */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                          <span className="text-emerald-400 font-bold block">PICKUP HUB</span>
                          <span className="text-white font-medium text-sm">{b.pickup_hub}</span>
                        </div>
                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                          <span className="text-rose-400 font-bold block">DROP-OFF HUB</span>
                          <span className="text-white font-medium text-sm">{b.drop_hub}</span>
                        </div>
                      </div>

                      {/* FARE & LOADING OTP */}
                      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 px-4 py-3 rounded-xl border border-slate-800">
                        <div>
                          <span className="text-xs text-slate-400 block">Freight Fare</span>
                          <span className="text-lg font-black text-amber-400">
                            ₹{b.agreed_fare || b.offered_fare}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-400 block">
                            Share 4-Digit Loading OTP with Driver
                          </span>
                          <span className="text-lg font-mono font-black tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-0.5 rounded-lg border border-emerald-500/30">
                            {b.pickup_otp}
                          </span>
                        </div>
                      </div>

                      {/* COUNTER-BIDS FROM DRIVERS */}
                      {b.status === 'broadcasting' && bids.length > 0 && (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 space-y-2">
                          <div className="text-xs font-bold text-amber-300">
                            Incoming Driver Counter-Bids ({bids.length}):
                          </div>
                          {bids.map((bid) => (
                            <div
                              key={bid.id}
                              className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs"
                            >
                              <div>
                                <div className="font-bold text-white">{bid.driver_name}</div>
                                <div className="text-slate-400">{bid.vehicle_number}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-amber-400">
                                  ₹{bid.bid_amount}
                                </span>
                                <button
                                  onClick={() => handleCustomerAcceptBid(b.id, bid)}
                                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                                >
                                  Accept Bid
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* ASSIGNED DRIVER INFO & DIRECT UPI QR AT DROP-OFF */}
                      {b.driver_name && (
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                          <div className="space-y-1 text-xs">
                            <div className="text-emerald-400 font-bold flex items-center gap-1">
                              <UserCheck className="w-4 h-4" /> Assigned Fleet Partner
                            </div>
                            <div className="text-white font-bold text-sm">{b.driver_name}</div>
                            <div className="text-slate-400">{b.driver_vehicle}</div>
                            <div className="text-slate-500">Direct UPI ID: {b.driver_upi}</div>
                          </div>

                          {b.status === 'delivered' && (
                            <div className="flex items-center gap-4 bg-white text-slate-950 p-3 rounded-xl">
                              <QRCodeSVG value={upiUri} size={88} />
                              <div className="text-xs">
                                <div className="font-black text-sm text-slate-900">
                                  SCAN TO PAY ₹{b.agreed_fare || b.offered_fare}
                                </div>
                                <div className="text-slate-600">
                                  GPay • PhonePe • Paytm
                                </div>
                                <div className="text-[10px] text-emerald-700 font-bold mt-1">
                                  0% Gateway Fee • Direct to Driver
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* ==================================================================
             DRIVER / FLEET PARTNER VIEW: ACCEPT LOADS, GOOGLE MAPS & UPI QR
             ================================================================== */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: DRIVER PROFILE & UPI SETUP */}
            <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 h-fit">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-400" />
                Driver Profile & Direct UPI Setup
              </h2>
              <p className="text-xs text-slate-400">
                Set your vehicle number and personal UPI ID. Customers pay 100% of the fare directly to your bank via dynamic QR code.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Driver Full Name</label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">
                    Yellow-Board Vehicle No. & Model
                  </label>
                  <input
                    type="text"
                    value={driverVehicle}
                    onChange={(e) => setDriverVehicle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-emerald-400 font-semibold block mb-1">
                    Your Personal PhonePe / GPay UPI ID
                  </label>
                  <input
                    type="text"
                    value={driverUpi}
                    onChange={(e) => setDriverUpi(e.target.value)}
                    className="w-full bg-slate-950 border border-emerald-500/50 rounded-lg px-3 py-2 text-sm font-mono text-emerald-300"
                  />
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: LIVE LOAD RADAR FOR DRIVERS */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
                  Bengaluru Live Load Radar ({bookings.length} Loads)
                </h2>
                <button
                  onClick={fetchLiveCloudData}
                  className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-slate-300"
                >
                  Sync Radar
                </button>
              </div>

              {bookings.map((b) => {
                const upiUri = `upi://pay?pa=${b.driver_upi || driverUpi}&pn=${encodeURIComponent(
                  b.driver_name || driverName
                )}&am=${b.agreed_fare || b.offered_fare}&cu=INR&tn=NammaCargo_Freight`;

                return (
                  <div
                    key={b.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-black text-xs">
                          {b.vehicle_category} NEEDED
                        </span>
                        <span className="font-bold text-white text-sm">
                          {b.cargo_type} ({b.weight_kg} kg)
                        </span>
                      </div>
                      <span className="text-xl font-black text-amber-400">
                        ₹{b.agreed_fare || b.offered_fare}
                      </span>
                    </div>

                    {/* PICKUP & DROP WITH 1-TAP GOOGLE MAPS BUTTONS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-emerald-400 font-bold block">PICKUP</span>
                          <span className="text-white font-semibold">{b.pickup_hub}</span>
                          <span className="text-slate-400 block mt-0.5">
                            Shipper: {b.customer_name} ({b.customer_phone})
                          </span>
                        </div>
                        <button
                          onClick={() => openGoogleMaps(b.pickup_hub)}
                          className="bg-slate-800 hover:bg-slate-700 text-emerald-400 px-2.5 py-2 rounded-lg flex items-center gap-1 font-bold shrink-0 cursor-pointer"
                          title="Open in Google Maps"
                        >
                          <Navigation className="w-3.5 h-3.5" /> Map
                        </button>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-rose-400 font-bold block">DROP-OFF</span>
                          <span className="text-white font-semibold">{b.drop_hub}</span>
                          {b.eway_bill_no && (
                            <span className="text-amber-400 block mt-0.5">
                              E-Way Bill: {b.eway_bill_no}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => openGoogleMaps(b.drop_hub)}
                          className="bg-slate-800 hover:bg-slate-700 text-rose-400 px-2.5 py-2 rounded-lg flex items-center gap-1 font-bold shrink-0 cursor-pointer"
                          title="Open in Google Maps"
                        >
                          <Navigation className="w-3.5 h-3.5" /> Map
                        </button>
                      </div>
                    </div>

                    {/* DRIVER ACTION CONTROLS BY STAGE */}
                    {b.status === 'broadcasting' && (
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
                        <button
                          onClick={() => handleDriverDirectAccept(b)}
                          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs cursor-pointer"
                        >
                          Accept Instantly for ₹{b.offered_fare}
                        </button>

                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            placeholder="Counter-bid ₹"
                            value={bidInputs[b.id] || ''}
                            onChange={(e) =>
                              setBidInputs({ ...bidInputs, [b.id]: e.target.value })
                            }
                            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white w-32"
                          />
                          <button
                            onClick={() => handleDriverPlaceBid(b.id)}
                            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-2 rounded-lg text-xs cursor-pointer"
                          >
                            Send Counter-Bid
                          </button>
                        </div>
                      </div>
                    )}

                    {b.status === 'accepted' && (
                      <div className="bg-blue-500/10 border border-blue-500/30 p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3">
                        <div className="text-xs text-blue-200">
                          <strong>Step 1:</strong> Drive to <strong>{b.pickup_hub}</strong>, load cargo, and enter Customer's 4-digit Pickup OTP:
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            maxLength={4}
                            placeholder="4-digit OTP"
                            value={otpInputs[b.id] || ''}
                            onChange={(e) =>
                              setOtpInputs({ ...otpInputs, [b.id]: e.target.value })
                            }
                            className="bg-slate-950 border border-blue-400 rounded-lg px-3 py-1.5 text-sm font-mono text-white w-28 text-center"
                          />
                          <button
                            onClick={() => handleVerifyPickupOtp(b)}
                            className="bg-blue-500 hover:bg-blue-400 text-slate-950 font-black px-4 py-2 rounded-lg text-xs cursor-pointer"
                          >
                            Verify OTP & Start Trip
                          </button>
                        </div>
                      </div>
                    )}

                    {b.status === 'in_transit' && (
                      <div className="bg-purple-500/10 border border-purple-500/30 p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3">
                        <div className="text-xs text-purple-200">
                          <strong>In Transit to {b.drop_hub}:</strong> Tap "Map" above for Google Maps navigation. Once unloaded, mark delivered to show your UPI QR code.
                        </div>
                        <button
                          onClick={() => handleMarkDelivered(b.id)}
                          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-2 rounded-lg text-xs cursor-pointer"
                        >
                          Mark Unloaded & Generate UPI QR
                        </button>
                      </div>
                    )}

                    {b.status === 'delivered' && (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="text-emerald-400 font-black text-sm flex items-center gap-1.5">
                            <CheckCircle2 className="w-5 h-5" /> Trip Delivered! Show QR to Customer
                          </div>
                          <p className="text-xs text-slate-300">
                            Customer can scan this QR with any UPI app to pay <strong>₹{b.agreed_fare || b.offered_fare}</strong> directly to <strong>{b.driver_upi || driverUpi}</strong>.
                          </p>
                        </div>
                        <div className="bg-white p-3 rounded-xl flex items-center gap-3 text-slate-950">
                          <QRCodeSVG value={upiUri} size={90} />
                          <div className="text-xs">
                            <div className="font-black text-sm">₹{b.agreed_fare || b.offered_fare}</div>
                            <div className="text-slate-600 text-[11px]">{b.driver_upi || driverUpi}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}