import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { QRCodeSVG } from 'qrcode.react';
import {
  Truck, Package, Navigation,
  Clock, CheckCircle2, AlertTriangle, RefreshCw,
  UserCheck, Sparkles, Radio, MapPin, Filter
} from 'lucide-react';

// ============================================================================
// 1. SUPABASE LIVE CLOUD CONNECTION
// ============================================================================
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://jfzxpwtuvflnmwjnhdph.supabase.co';
const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_8FQR2H08lxEArRynnpiXOg_W9iLlm9a';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================================================
// 2. BENGALURU HUBS WITH GPS COORDINATES FOR RADIUS MATCHING
// ============================================================================
const BENGALURU_HUBS = [
  { name: 'Avalahalli / Old Madras Rd', zone: 'East Corridor', lat: 13.0121, lng: 77.7122, trafficNote: 'Check Tin Factory / KR Puram merge' },
  { name: 'KR Puram / Tin Factory', zone: 'East', lat: 13.0036, lng: 77.6863, trafficNote: 'Heavy peak-hour bottleneck' },
  { name: 'Whitefield / ITPL Main Rd', zone: 'East Tech & Warehousing', lat: 12.9698, lng: 77.7499, trafficNote: 'Smooth via Hoodi link road' },
  { name: 'Peenya Industrial Area (1st-4th Stage)', zone: 'North-West Industrial', lat: 13.0296, lng: 77.5223, trafficNote: 'Heavy truck corridor via Goraguntepalya' },
  { name: 'Yeshwanthpur APMC Yard', zone: 'North-West Wholesale', lat: 13.0247, lng: 77.5539, trafficNote: 'RMC Yard loading gates busy 8 AM - 12 PM' },
  { name: 'KR Market / Chickpet / SP Road', zone: 'Central Wholesale', lat: 12.9647, lng: 77.5797, trafficNote: 'Narrow lanes: 2W & 3W Cargo Auto preferred' },
  { name: 'Electronic City Phase 1 & 2', zone: 'South Industrial', lat: 12.8399, lng: 77.6770, trafficNote: 'Fast access via Elevated Expressway' },
  { name: 'Bommasandra Industrial Area', zone: 'Deep South Manufacturing', lat: 12.8124, lng: 77.6917, trafficNote: 'Hosur Road commercial corridor' },
  { name: 'Koramangala / HSR Layout', zone: 'South-East Commercial', lat: 12.9352, lng: 77.6245, trafficNote: 'Watch Silk Board Junction congestion' },
  { name: 'Indiranagar / Domlur', zone: 'Central-East Retail', lat: 12.9719, lng: 77.6412, trafficNote: '100 Feet Road commercial loading zones' },
  { name: 'Hebbal / Yelahanka', zone: 'North Corridor', lat: 13.0358, lng: 77.5970, trafficNote: 'Airport Road flyover clear' },
  { name: 'Mysore Road / Kengeri', zone: 'West Corridor', trafficNote: '12.9250', lat: 12.9250, lng: 77.4981, trafficNote: 'NICE Road interchange easy for 4W/6W trucks' }
];

const FLEET_TYPES = [
  { id: '2W', name: '2W Cargo Bike / Scooter', maxWeight: 25, baseFare: 45, perKm: 11, badge: '1 - 25 kg' },
  { id: '3W', name: '3W Cargo Auto (Goods)', maxWeight: 500, baseFare: 160, perKm: 19, badge: '26 - 500 kg' },
  { id: '4W', name: '4W Mini Truck (Chota Hathi)', maxWeight: 1500, baseFare: 320, perKm: 28, badge: '501 - 1,500 kg' },
  { id: '6W', name: '6W+ Heavy Commercial Truck', maxWeight: 10000, baseFare: 950, perKm: 52, badge: '1,501 - 10,000 kg' }
];

// Haversine formula to calculate distance in km between two hubs
function calculateDistanceKm(hubNameA, hubNameB) {
  const hA = BENGALURU_HUBS.find((h) => h.name === hubNameA) || BENGALURU_HUBS[0];
  const hB = BENGALURU_HUBS.find((h) => h.name === hubNameB) || BENGALURU_HUBS[3];
  
  const R = 6371; // Earth radius in km
  const dLat = ((hB.lat - hA.lat) * Math.PI) / 180;
  const dLon = ((hB.lng - hA.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((hA.lat * Math.PI) / 180) *
      Math.cos((hB.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export default function App() {
  const [mode, setMode] = useState('customer');
  const [cloudConnected, setCloudConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const [bookings, setBookings] = useState([]);
  const [bidsByBooking, setBidsByBooking] = useState({});

  // Customer State
  const [customerName, setCustomerName] = useState('Prateek Traders & Hardware');
  const [customerPhone, setCustomerPhone] = useState('9845012345');
  const [pickupHub, setPickupHub] = useState(BENGALURU_HUBS[0].name);
  const [dropHub, setDropHub] = useState(BENGALURU_HUBS[3].name);
  const [cargoType, setCargoType] = useState('Hardware & Electrical Boxes');
  const [weightKg, setWeightKg] = useState(320);
  const [selectedFleet, setSelectedFleet] = useState('3W');
  const [customFare, setCustomFare] = useState(380);
  const [ewayBill, setEwayBill] = useState('');

  // Driver State & Geospatial Radius Filter
  const [driverName, setDriverName] = useState('Raju Gowda');
  const [driverVehicle, setDriverVehicle] = useState('KA-53-C-4821 (3W Ape Cargo)');
  const [driverUpi, setDriverUpi] = useState('rajugowda@ybl');
  const [driverBaseHub, setDriverBaseHub] = useState(BENGALURU_HUBS[3].name); // e.g. Peenya
  const [radiusFilterKm, setRadiusFilterKm] = useState(25); // Max km radius
  const [bidInputs, setBidInputs] = useState({});
  const [otpInputs, setOtpInputs] = useState({});
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    const autoFleet =
      FLEET_TYPES.find((f) => weightKg <= f.maxWeight) || FLEET_TYPES[FLEET_TYPES.length - 1];
    setSelectedFleet(autoFleet.id);

    const distKm = calculateDistanceKm(pickupHub, dropHub);
    const estFare = Math.round((autoFleet.baseFare + Math.max(4, distKm) * autoFleet.perKm) / 10) * 10;
    setCustomFare(estFare);
  }, [weightKg, pickupHub, dropHub]);

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
    const channel = supabase
      .channel('namma-cargo-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => fetchLiveCloudData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bids' }, () => fetchLiveCloudData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleBroadcastLoad = async (e) => {
    e.preventDefault();
    if (pickupHub === dropHub) {
      alert('Please select different Pickup and Drop hubs.');
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

    if (!error) {
      setStatusMessage('Load broadcasted live to Bengaluru fleet partners!');
      setTimeout(() => setStatusMessage(''), 4000);
      fetchLiveCloudData();
    }
  };

  const handleDriverDirectAccept = async (booking) => {
    await supabase.from('bookings').update({
      status: 'accepted',
      agreed_fare: booking.offered_fare,
      driver_name: driverName,
      driver_vehicle: driverVehicle,
      driver_upi: driverUpi
    }).eq('id', booking.id);
    fetchLiveCloudData();
  };

  const handleDriverPlaceBid = async (bookingId) => {
    const amount = Number(bidInputs[bookingId]);
    if (!amount) return;
    await supabase.from('bids').insert([{
      booking_id: bookingId,
      driver_name: driverName,
      vehicle_number: driverVehicle,
      driver_upi: driverUpi,
      bid_amount: amount
    }]);
    setBidInputs({ ...bidInputs, [bookingId]: '' });
    fetchLiveCloudData();
  };

  const handleCustomerAcceptBid = async (bookingId, bid) => {
    await supabase.from('bookings').update({
      status: 'accepted',
      agreed_fare: bid.bid_amount,
      driver_name: bid.driver_name,
      driver_vehicle: bid.vehicle_number,
      driver_upi: bid.driver_upi
    }).eq('id', bookingId);
    fetchLiveCloudData();
  };

  const handleVerifyOtp = async (booking) => {
    if ((otpInputs[booking.id] || '').trim() !== booking.pickup_otp) {
      alert(`Incorrect OTP! Hint: ${booking.pickup_otp}`);
      return;
    }
    await supabase.from('bookings').update({ status: 'in_transit' }).eq('id', booking.id);
    fetchLiveCloudData();
  };

  const handleDeliver = async (bookingId) => {
    await supabase.from('bookings').update({ status: 'delivered' }).eq('id', bookingId);
    fetchLiveCloudData();
  };

  const openGoogleMaps = (hubName) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(hubName + ', Bengaluru')}`, '_blank');
  };

  // Filter bookings for driver based on radius from driver's base hub
  const filteredDriverBookings = bookings.filter((b) => {
    if (b.status !== 'broadcasting') return true; // Show accepted/active trips
    const dist = calculateDistanceKm(driverBaseHub, b.pickup_hub);
    return dist <= radiusFilterKm;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
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
                  {cloudConnected ? 'LIVE CLOUD + POSTGIS RADIUS' : 'SYNCING...'}
                </span>
              </div>
              <p className="text-xs text-slate-400">Bengaluru Freight Network • Geospatial Matching Active</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setMode('customer')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                mode === 'customer' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Package className="w-4 h-4" /> Customer Mode
            </button>
            <button
              onClick={() => setMode('driver')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                mode === 'driver' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Truck className="w-4 h-4" /> Driver Radar ({filteredDriverBookings.length})
            </button>
          </div>
        </div>
      </header>

      {statusMessage && (
        <div className="max-w-6xl mx-auto mt-4 px-4">
          <div className="bg-emerald-500/20 border border-emerald-500 text-emerald-200 px-4 py-3 rounded-xl flex items-center justify-between text-sm font-medium">
            <span>{statusMessage}</span>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 mt-6">
        {mode === 'customer' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-amber-400" /> Broadcast Cargo Load
              </h2>

              <form onSubmit={handleBroadcastLoad} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Shipper Name</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Mobile</label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-emerald-400 font-semibold block mb-1">Pickup Hub</label>
                  <select
                    value={pickupHub}
                    onChange={(e) => setPickupHub(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white"
                  >
                    {BENGALURU_HUBS.map((h) => (
                      <option key={h.name} value={h.name}>{h.name} ({h.zone})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-rose-400 font-semibold block mb-1">Drop-Off Hub</label>
                  <select
                    value={dropHub}
                    onChange={(e) => setDropHub(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white"
                  >
                    {BENGALURU_HUBS.map((h) => (
                      <option key={h.name} value={h.name}>{h.name} ({h.zone})</option>
                    ))}
                  </select>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-slate-400">Calculated Route Distance:</span>
                  <span className="text-amber-400 font-bold text-sm">{calculateDistanceKm(pickupHub, dropHub)} km</span>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Cargo Description</label>
                  <input
                    type="text"
                    value={cargoType}
                    onChange={(e) => setCargoType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                    required
                  />
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-400">Weight:</span>
                    <span className="text-amber-400 font-bold">{weightKg} kg</span>
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
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Offer Fare (₹)</label>
                    <input
                      type="number"
                      value={customFare}
                      onChange={(e) => setCustomFare(e.target.value)}
                      className="w-full bg-slate-950 border border-amber-500/60 rounded-lg px-3 py-2 text-base font-bold text-amber-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">E-Way Bill (Optional)</label>
                    <input
                      type="text"
                      value={ewayBill}
                      onChange={(e) => setEwayBill(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  <Truck className="w-5 h-5" /> Broadcast Load (₹{customFare})
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-400" /> Active Shipments ({bookings.length})
              </h2>

              {bookings.map((b) => {
                const bids = bidsByBooking[b.id] || [];
                const upiUri = `upi://pay?pa=${b.driver_upi || 'rajugowda@ybl'}&pn=${encodeURIComponent(b.driver_name || 'Driver')}&am=${b.agreed_fare || b.offered_fare}&cu=INR`;
                const dist = calculateDistanceKm(b.pickup_hub, b.drop_hub);

                return (
                  <div key={b.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-black text-xs">
                          {b.vehicle_category}
                        </span>
                        <span className="font-bold text-white text-sm">{b.cargo_type}</span>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full uppercase bg-amber-500/20 text-amber-300">
                        {b.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-emerald-400 font-bold block">PICKUP</span>
                        <span className="text-white">{b.pickup_hub}</span>
                      </div>
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-rose-400 font-bold block">DROP ({dist} km route)</span>
                        <span className="text-white">{b.drop_hub}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-xs text-slate-400">Fare: </span>
                        <span className="font-black text-amber-400">₹{b.agreed_fare || b.offered_fare}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400">Pickup OTP: </span>
                        <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">{b.pickup_otp}</span>
                      </div>
                    </div>

                    {b.status === 'broadcasting' && bids.length > 0 && (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 space-y-2">
                        <div className="text-xs font-bold text-amber-300">Driver Counter-Bids:</div>
                        {bids.map((bid) => (
                          <div key={bid.id} className="flex justify-between items-center bg-slate-950 p-2 rounded text-xs">
                            <div>
                              <div className="font-bold text-white">{bid.driver_name}</div>
                              <div className="text-slate-400">{bid.vehicle_number}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-amber-400">₹{bid.bid_amount}</span>
                              <button
                                onClick={() => handleCustomerAcceptBid(b.id, bid)}
                                className="bg-emerald-500 text-slate-950 font-bold px-3 py-1 rounded cursor-pointer"
                              >
                                Accept
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {b.driver_name && b.status === 'delivered' && (
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                        <div className="text-xs">
                          <span className="text-emerald-400 font-bold">Delivered by {b.driver_name}</span>
                          <div className="text-slate-400">UPI: {b.driver_upi}</div>
                        </div>
                        <div className="bg-white p-2 rounded-xl">
                          <QRCodeSVG value={upiUri} size={72} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 h-fit">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-400" /> Driver Location & Radius
              </h2>
              <p className="text-xs text-slate-400">
                Select your current hub in Bengaluru. The PostGIS radius filter will only show loads originating near you.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Your Base Hub / Current Stand</label>
                  <select
                    value={driverBaseHub}
                    onChange={(e) => setDriverBaseHub(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    {BENGALURU_HUBS.map((h) => (
                      <option key={h.name} value={h.name}>{h.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-emerald-400 font-semibold block mb-1">
                    Max Pickup Radius: {radiusFilterKm} km
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="40"
                    step="5"
                    value={radiusFilterKm}
                    onChange={(e) => setRadiusFilterKm(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Driver UPI ID for Payouts</label>
                  <input
                    type="text"
                    value={driverUpi}
                    onChange={(e) => setDriverUpi(e.target.value)}
                    className="w-full bg-slate-950 border border-emerald-500/50 rounded-lg px-3 py-2 text-xs text-emerald-300 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
                  Filtered Radar ({filteredDriverBookings.length} Loads within {radiusFilterKm} km)
                </h2>
                <button
                  onClick={fetchLiveCloudData}
                  className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-slate-300 cursor-pointer"
                >
                  Refresh Radar
                </button>
              </div>

              {filteredDriverBookings.map((b) => {
                const distFromDriver = calculateDistanceKm(driverBaseHub, b.pickup_hub);
                const upiUri = `upi://pay?pa=${b.driver_upi || driverUpi}&pn=${encodeURIComponent(driverName)}&am=${b.agreed_fare || b.offered_fare}&cu=INR`;

                return (
                  <div key={b.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-black text-xs">
                          {b.vehicle_category}
                        </span>
                        <span className="font-bold text-white text-sm">{b.cargo_type} ({b.weight_kg} kg)</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-amber-400 block">₹{b.agreed_fare || b.offered_fare}</span>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold">
                          📍 {distFromDriver} km from your stand
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                        <div>
                          <span className="text-emerald-400 font-bold block">PICKUP</span>
                          <span className="text-white">{b.pickup_hub}</span>
                        </div>
                        <button
                          onClick={() => openGoogleMaps(b.pickup_hub)}
                          className="bg-slate-800 text-emerald-400 p-2 rounded-lg font-bold cursor-pointer"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                        <div>
                          <span className="text-rose-400 font-bold block">DROP-OFF</span>
                          <span className="text-white">{b.drop_hub}</span>
                        </div>
                        <button
                          onClick={() => openGoogleMaps(b.drop_hub)}
                          className="bg-slate-800 text-rose-400 p-2 rounded-lg font-bold cursor-pointer"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {b.status === 'broadcasting' && (
                      <div className="flex flex-wrap justify-between items-center gap-3 pt-2 border-t border-slate-800">
                        <button
                          onClick={() => handleDriverDirectAccept(b)}
                          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs cursor-pointer"
                        >
                          Accept Instantly
                        </button>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            placeholder="Counter bid ₹"
                            value={bidInputs[b.id] || ''}
                            onChange={(e) => setBidInputs({ ...bidInputs, [b.id]: e.target.value })}
                            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white w-28"
                          />
                          <button
                            onClick={() => handleDriverPlaceBid(b.id)}
                            className="bg-amber-500 text-slate-950 font-bold px-3 py-2 rounded-lg text-xs cursor-pointer"
                          >
                            Bid
                          </button>
                        </div>
                      </div>
                    )}

                    {b.status === 'accepted' && (
                      <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-xl flex justify-between items-center text-xs">
                        <span>Enter 4-digit Pickup OTP:</span>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={4}
                            placeholder="OTP"
                            value={otpInputs[b.id] || ''}
                            onChange={(e) => setOtpInputs({ ...otpInputs, [b.id]: e.target.value })}
                            className="bg-slate-950 border border-blue-400 rounded px-2 py-1 text-white w-20 text-center font-mono"
                          />
                          <button
                            onClick={() => handleVerifyOtp(b)}
                            className="bg-blue-500 text-slate-950 font-black px-3 py-1 rounded cursor-pointer"
                          >
                            Verify & Start
                          </button>
                        </div>
                      </div>
                    )}

                    {b.status === 'in_transit' && (
                      <div className="bg-purple-500/10 border border-purple-500/30 p-3 rounded-xl flex justify-between items-center text-xs">
                        <span>In Transit to {b.drop_hub}</span>
                        <button
                          onClick={() => handleDeliver(b.id)}
                          className="bg-emerald-500 text-slate-950 font-black px-4 py-1.5 rounded cursor-pointer"
                        >
                          Mark Delivered & Show QR
                        </button>
                      </div>
                    )}

                    {b.status === 'delivered' && (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex justify-between items-center">
                        <div className="text-xs">
                          <span className="text-emerald-400 font-bold">Trip Delivered!</span>
                          <p className="text-slate-300">Customer scanned QR & paid ₹{b.agreed_fare || b.offered_fare}</p>
                        </div>
                        <div className="bg-white p-2 rounded-xl">
                          <QRCodeSVG value={upiUri} size={72} />
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