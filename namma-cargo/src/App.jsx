import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { QRCodeSVG } from 'qrcode.react';
import {
  Truck, Package, Navigation,
  Clock, Sparkles, Radio, MapPin, Share2, LogOut, ShieldCheck, CheckCircle, AlertTriangle
} from 'lucide-react';

// ============================================================================
// 1. SUPABASE LIVE CLOUD CONNECTION
// ============================================================================
const SUPABASE_URL = 'https://jfzxpwtuvflnmwjnhdph.supabase.co';
const SUPABASE_KEY = 'sb_publishable_8FQR2H08lxEArRynnpiXOg_W9iLlm9a';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================================================
// 2. BENGALURU HUBS WITH GPS COORDINATES FOR RADIUS MATCHING
// ============================================================================
const BENGALURU_HUBS = [
  { name: 'Avalahalli / Old Madras Rd', zone: 'East Corridor', lat: 13.0121, lng: 77.7122 },
  { name: 'KR Puram / Tin Factory', zone: 'East', lat: 13.0036, lng: 77.6863 },
  { name: 'Whitefield / ITPL Main Rd', zone: 'East Tech & Warehousing', lat: 12.9698, lng: 77.7499 },
  { name: 'Peenya Industrial Area (1st-4th Stage)', zone: 'North-West Industrial', lat: 13.0296, lng: 77.5223 },
  { name: 'Yeshwanthpur APMC Yard', zone: 'North-West Wholesale', lat: 13.0247, lng: 77.5539 },
  { name: 'KR Market / Chickpet / SP Road', zone: 'Central Wholesale', lat: 12.9647, lng: 77.5797 },
  { name: 'Electronic City Phase 1 & 2', zone: 'South Industrial', lat: 12.8399, lng: 77.6770 },
  { name: 'Bommasandra Industrial Area', zone: 'Deep South Manufacturing', lat: 12.8124, lng: 77.6917 },
  { name: 'Koramangala / HSR Layout', zone: 'South-East Commercial', lat: 12.9352, lng: 77.6245 },
  { name: 'Indiranagar / Domlur', zone: 'Central-East Retail', lat: 12.9719, lng: 77.6412 },
  { name: 'Hebbal / Yelahanka', zone: 'North Corridor', lat: 13.0358, lng: 77.5970 },
  { name: 'Mysore Road / Kengeri', zone: 'West Corridor', lat: 12.9250, lng: 77.4981 }
];

const FLEET_TYPES = [
  { id: '2W', name: '2W Cargo Bike / Scooter', maxWeight: 25, baseFare: 45, perKm: 11, badge: '1 - 25 kg' },
  { id: '3W', name: '3W Cargo Auto (Goods)', maxWeight: 500, baseFare: 160, perKm: 19, badge: '26 - 500 kg' },
  { id: '4W', name: '4W Mini Truck (Chota Hathi)', maxWeight: 1500, baseFare: 320, perKm: 28, badge: '501 - 1,500 kg' },
  { id: '6W', name: '6W+ Heavy Commercial Truck', maxWeight: 10000, baseFare: 950, perKm: 52, badge: '1,501 - 10,000 kg' }
];

function calculateDistanceKm(hubNameA, hubNameB) {
  const hA = BENGALURU_HUBS.find((h) => h.name === hubNameA) || BENGALURU_HUBS[0];
  const hB = BENGALURU_HUBS.find((h) => h.name === hubNameB) || BENGALURU_HUBS[3];
  const R = 6371;
  const dLat = ((hB.lat - hA.lat) * Math.PI) / 180;
  const dLon = ((hB.lng - hA.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((hA.lat * Math.PI) / 180) * Math.cos((hB.lat * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export default function App() {
  // Authentication State
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [userSession, setUserSession] = useState(localStorage.getItem('namma_user_phone') || null);

  // KYC Verification State
  const [isKycDone, setIsKycDone] = useState(localStorage.getItem('namma_kyc_done') === 'true');
  const [driverNameInput, setDriverNameInput] = useState(localStorage.getItem('namma_driver_name') || 'Raju Gowda');
  const [dlNumber, setDlNumber] = useState('KA0320230019284');
  const [rcNumber, setRcNumber] = useState(localStorage.getItem('namma_driver_rc') || 'KA-53-C-4821');
  const [verifiedVehicleModel, setVerifiedVehicleModel] = useState(
    localStorage.getItem('namma_vehicle_model') || 'Piaggio Ape Xtra LDX (3W Goods)'
  );
  const [verifiedRtoOffice, setVerifiedRtoOffice] = useState(
    localStorage.getItem('namma_rto_office') || 'KA-53 KR Puram RTO'
  );
  const [kycError, setKycError] = useState('');

  const [mode, setMode] = useState('customer');
  const [cloudConnected, setCloudConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const [bookings, setBookings] = useState([]);
  const [bidsByBooking, setBidsByBooking] = useState({});

  // Customer State
  const [customerName, setCustomerName] = useState('Prateek Traders & Hardware');
  const [pickupHub, setPickupHub] = useState(BENGALURU_HUBS[0].name);
  const [dropHub, setDropHub] = useState(BENGALURU_HUBS[3].name);
  const [cargoType, setCargoType] = useState('Hardware & Electrical Boxes');
  const [weightKg, setWeightKg] = useState(320);
  const [selectedFleet, setSelectedFleet] = useState('3W');
  const [customFare, setCustomFare] = useState(380);
  const [ewayBill, setEwayBill] = useState('');

  // Driver State & Geospatial Radius Filter
  const [driverBaseHub, setDriverBaseHub] = useState(BENGALURU_HUBS[3].name);
  const [radiusFilterKm, setRadiusFilterKm] = useState(25);
  const [bidInputs, setBidInputs] = useState({});
  const [otpInputs, setOtpInputs] = useState({});
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    const autoFleet = FLEET_TYPES.find((f) => weightKg <= f.maxWeight) || FLEET_TYPES[FLEET_TYPES.length - 1];
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

    const { data: bidData } = await supabase.from('bids').select('*').order('created_at', { ascending: true });

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
    if (!userSession) return;
    fetchLiveCloudData();
    const channel = supabase
      .channel('namma-cargo-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => fetchLiveCloudData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bids' }, () => fetchLiveCloudData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userSession]);

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (phone.length < 10) {
      alert('Please enter a valid 10-digit mobile number');
      return;
    }
    setOtpSent(true);
    setStatusMessage('OTP sent! Use test code: 1234');
    setTimeout(() => setStatusMessage(''), 4000);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otpCode !== '1234') {
      alert('Incorrect OTP! Please use test code: 1234');
      return;
    }
    localStorage.setItem('namma_user_phone', phone);
    setUserSession(phone);
    setStatusMessage('Phone verified successfully!');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handleCompleteKyc = async (e) => {
    e.preventDefault();
    setKycError('');

    if (!dlNumber || !rcNumber) {
      setKycError('Please enter both Driving License and Vehicle RC details.');
      return;
    }

    setStatusMessage('Querying Supabase RTO Master Registry...');

    const { data, error } = await supabase.rpc('verify_karnataka_rto', {
      p_phone: userSession,
      p_name: driverNameInput,
      p_dl: dlNumber,
      p_rc: rcNumber
    });

    if (error) {
      setKycError('Database Error: ' + error.message);
      setStatusMessage('');
      return;
    }

    if (!data?.valid) {
      setKycError(data?.error || 'RTO Verification Failed!');
      setStatusMessage('');
      return;
    }

    // Save Official Registry Match Details
    localStorage.setItem('namma_kyc_done', 'true');
    localStorage.setItem('namma_driver_name', data.owner_name);
    localStorage.setItem('namma_driver_rc', data.rc_number);
    localStorage.setItem('namma_vehicle_model', data.vehicle_model);
    localStorage.setItem('namma_rto_office', data.rto_office);

    setDriverNameInput(data.owner_name);
    setRcNumber(data.rc_number);
    setVerifiedVehicleModel(data.vehicle_model);
    setVerifiedRtoOffice(data.rto_office);
    setIsKycDone(true);

    setStatusMessage(`Verified: ${data.vehicle_model} (${data.rto_office})`);
    setTimeout(() => setStatusMessage(''), 5000);
  };

  const handleLogout = () => {
    localStorage.removeItem('namma_user_phone');
    localStorage.removeItem('namma_kyc_done');
    localStorage.removeItem('namma_driver_name');
    localStorage.removeItem('namma_driver_rc');
    localStorage.removeItem('namma_vehicle_model');
    localStorage.removeItem('namma_rto_office');
    setUserSession(null);
    setIsKycDone(false);
    setPhone('');
    setOtpSent(false);
    setOtpCode('');
    setKycError('');
  };

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
        customer_phone: userSession,
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
    } else {
      alert('Broadcast error: ' + error.message);
    }
  };

  const handleDriverDirectAccept = async (booking) => {
    await supabase.from('bookings').update({
      status: 'accepted',
      agreed_fare: booking.offered_fare,
      driver_name: driverNameInput,
      driver_vehicle: `${rcNumber} • ${verifiedVehicleModel}`,
      driver_upi: `${driverNameInput.toLowerCase().replace(/\s+/g, '')}@ybl`
    }).eq('id', booking.id);
    fetchLiveCloudData();
  };

  const handleDriverPlaceBid = async (bookingId) => {
    const amount = Number(bidInputs[bookingId]);
    if (!amount) return;
    await supabase.from('bids').insert([{
      booking_id: bookingId,
      driver_name: driverNameInput,
      vehicle_number: `${rcNumber} (${verifiedVehicleModel})`,
      driver_upi: `${driverNameInput.toLowerCase().replace(/\s+/g, '')}@ybl`,
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

  const handleVerifyPickupOtp = async (booking) => {
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

  const shareOnWhatsApp = (b) => {
    const text = `🚨 *NAMMA CARGO LOAD ALERT* 🚨\n\n📦 *Cargo:* ${b.cargo_type} (${b.weight_kg} kg)\n📍 *Pickup:* ${b.pickup_hub}\n🎯 *Drop:* ${b.drop_hub}\n💰 *Fare:* ₹${b.agreed_fare || b.offered_fare}\n🚛 *Vehicle:* ${b.vehicle_category} Needed\n\nAccept instantly on NammaCargo App!`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const filteredDriverBookings = bookings.filter((b) => {
    if (b.status !== 'broadcasting') return true;
    return calculateDistanceKm(driverBaseHub, b.pickup_hub) <= radiusFilterKm;
  });

  // ============================================================================
  // 1. RENDER LOGIN SCREEN
  // ============================================================================
  if (!userSession) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-block bg-amber-500 text-slate-950 p-3 rounded-2xl font-black mb-2 shadow">
              <Truck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              NAMMA<span className="text-amber-400">CARGO</span>
            </h1>
            <p className="text-xs text-slate-400">Bengaluru's Zero-Commission Logistics Network</p>
          </div>

          {statusMessage && (
            <div className="bg-emerald-500/20 border border-emerald-500 text-emerald-200 p-3 rounded-xl text-xs text-center font-medium">
              {statusMessage}
            </div>
          )}

          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Enter Mobile Number</label>
                <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5">
                  <span className="text-slate-400 text-sm font-bold mr-2">+91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="9845012345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-transparent text-sm text-white focus:outline-none"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl shadow transition text-sm cursor-pointer"
              >
                Get Verification OTP
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center">
                <span className="text-xs text-slate-400">OTP sent to +91 {phone}</span>
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="text-xs text-amber-400 block mx-auto mt-1 hover:underline cursor-pointer"
                >
                  Change Number
                </button>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Enter 4-Digit OTP (Test Code: 1234)</label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="1234"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full bg-slate-950 border border-emerald-500/60 rounded-xl px-4 py-3 text-center text-xl font-mono text-emerald-300 tracking-widest"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl shadow transition text-sm cursor-pointer"
              >
                Verify & Login
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // 2. RENDER DRIVER KYC SCREEN (VERIFIES AGAINST SUPABASE RTO REGISTRY)
  // ============================================================================
  if (!isKycDone) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-7 max-w-lg w-full shadow-2xl space-y-5">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" /> Karnataka RTO Registry Check
              </h2>
              <p className="text-xs text-slate-400">Checks Yellow-Board Permit & Fitness Certificate in Cloud Registry</p>
            </div>
            <button onClick={handleLogout} className="text-rose-400 hover:text-rose-300 text-xs font-semibold cursor-pointer">
              Logout
            </button>
          </div>

          {kycError && (
            <div className="bg-rose-500/20 border border-rose-500 text-rose-200 p-3.5 rounded-xl text-xs font-medium flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <span>{kycError}</span>
            </div>
          )}

          <form onSubmit={handleCompleteKyc} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Driver / Operator Name</label>
              <input
                type="text"
                value={driverNameInput}
                onChange={(e) => setDriverNameInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                required
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Sarathi Driving License (DL) Number</label>
              <input
                type="text"
                value={dlNumber}
                onChange={(e) => setDlNumber(e.target.value)}
                placeholder="KA0320230019284"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white uppercase font-mono"
                required
              />
            </div>

            <div>
              <label className="text-xs text-emerald-400 block mb-1">Commercial Vehicle RC Number</label>
              <input
                type="text"
                value={rcNumber}
                onChange={(e) => setRcNumber(e.target.value)}
                placeholder="KA-53-C-4821"
                className="w-full bg-slate-950 border border-emerald-500/50 rounded-xl px-3 py-2 text-sm text-emerald-300 uppercase font-mono font-bold"
                required
              />
            </div>

            {/* Interactive Registry Test Presets */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
              <span className="text-[11px] text-slate-400 font-bold block">
                Click any test RC below to test your live Supabase RTO Database rules:
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => { setRcNumber('KA-53-C-4821'); setKycError(''); }}
                  className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 px-2.5 py-1.5 rounded-lg text-left cursor-pointer hover:bg-emerald-500/25"
                >
                  ✅ <b>KA-53-C-4821</b> (Valid 3W Yellow Board)
                </button>
                <button
                  type="button"
                  onClick={() => { setRcNumber('KA-04-AB-9012'); setKycError(''); }}
                  className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 px-2.5 py-1.5 rounded-lg text-left cursor-pointer hover:bg-emerald-500/25"
                >
                  ✅ <b>KA-04-AB-9012</b> (Valid 4W Tata Ace)
                </button>
                <button
                  type="button"
                  onClick={() => { setRcNumber('KA-01-MP-1122'); setKycError(''); }}
                  className="bg-rose-500/15 border border-rose-500/40 text-rose-300 px-2.5 py-1.5 rounded-lg text-left cursor-pointer hover:bg-rose-500/25"
                >
                  ❌ <b>KA-01-MP-1122</b> (Private White-Board Car)
                </button>
                <button
                  type="button"
                  onClick={() => { setRcNumber('KA-02-C-3344'); setKycError(''); }}
                  className="bg-amber-500/15 border border-amber-500/40 text-amber-300 px-2.5 py-1.5 rounded-lg text-left cursor-pointer hover:bg-amber-500/25"
                >
                  ⚠️ <b>KA-02-C-3344</b> (Expired Fitness / FC)
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl shadow transition text-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" /> Verify Against RTO Master Registry
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ============================================================================
  // 3. MAIN APP INTERFACE (WHEN AUTHENTICATED & RTO REGISTRY VERIFIED)
  // ============================================================================
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
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 font-semibold">
                  <Radio className="w-3 h-3 animate-pulse" />
                  {cloudConnected ? 'RTO REGISTRY VERIFIED' : 'SYNCING...'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {driverNameInput} • {rcNumber} ({verifiedVehicleModel})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
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

            <button
              onClick={handleLogout}
              className="bg-slate-800 hover:bg-slate-700 text-rose-400 p-2 rounded-xl border border-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
              title="Logout & Test Another RC"
            >
              <LogOut className="w-4 h-4" />
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
                    <label className="text-xs text-slate-400 block mb-1">Verified Mobile</label>
                    <input
                      type="text"
                      value={userSession}
                      disabled
                      className="w-full bg-slate-950 border border-emerald-500/50 rounded-lg px-3 py-2 text-sm text-emerald-300 font-mono"
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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => shareOnWhatsApp(b)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow"
                        >
                          <Share2 className="w-3.5 h-3.5" /> WhatsApp
                        </button>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full uppercase bg-amber-500/20 text-amber-300">
                          {b.status.replace('_', ' ')}
                        </span>
                      </div>
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
                          <div className="text-slate-400">{b.driver_vehicle}</div>
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

                <div className="bg-slate-950 p-3.5 rounded-xl border border-emerald-500/30 text-xs space-y-1.5">
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" /> Official RTO Registry Match
                  </span>
                  <span className="text-slate-200 block font-semibold">{verifiedVehicleModel}</span>
                  <span className="text-slate-400 block">RC: {rcNumber} ({verifiedRtoOffice})</span>
                  <span className="text-slate-400 block">DL: {dlNumber}</span>
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
                const upiUri = `upi://pay?pa=${driverNameInput.toLowerCase().replace(/\s+/g, '')}@ybl&pn=${encodeURIComponent(driverNameInput)}&am=${b.agreed_fare || b.offered_fare}&cu=INR`;

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
                            onClick={() => handleVerifyPickupOtp(b)}
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