import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { QRCodeSVG } from 'qrcode.react';
import {
  Truck, Package, Navigation,
  Clock, Sparkles, Radio, MapPin, Share2, LogOut, ShieldCheck, CheckCircle,
  AlertTriangle, FileCheck, LocateFixed, Repeat, Sliders, ArrowLeftRight, Layers, Shield, PlusCircle, XCircle, RotateCcw
} from 'lucide-react';

// ============================================================================
// 1. SUPABASE LIVE CLOUD CONNECTION
// ============================================================================
const SUPABASE_URL = 'https://jfzxpwtuvflnmwjnhdph.supabase.co';
const SUPABASE_KEY = 'sb_publishable_8FQR2H08lxEArRynnpiXOg_W9iLlm9a';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================================================
// 2. BENGALURU HUBS WITH GPS COORDINATES
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
  { id: '2W', name: '2W Cargo Scooter', maxWeight: 25, baseFare: 45, perKm: 11, badge: 'Up to 25 kg' },
  { id: '3W', name: '3W Goods Auto', maxWeight: 500, baseFare: 160, perKm: 19, badge: 'Up to 500 kg' },
  { id: '4W', name: '4W Tata Ace / Pickup', maxWeight: 1500, baseFare: 320, perKm: 28, badge: 'Up to 1,500 kg' },
  { id: '6W', name: '6W+ Commercial Lorry', maxWeight: 10000, baseFare: 950, perKm: 52, badge: 'Up to 10,000 kg' }
];

const SMART_CARGO_PRESETS = [
  { label: '⚡ Small Spares', desc: 'Urgent Spare Parts & Tools', units: '2 Boxes', weight: 20, fleet: '2W' },
  { label: '📦 Electrical Boxes', desc: 'Hardware & Electrical Cartons', units: '12 Cartons', weight: 150, fleet: '3W' },
  { label: '🪑 Furniture / Retail', desc: 'Commercial Furniture & Fixtures', units: '6 Crates', weight: 350, fleet: '4W' },
  { label: '⚙️ CNC Machinery', desc: 'Industrial Lathe / CNC Machine Parts', units: '2 Pallets', weight: 500, fleet: '4W' },
  { label: '🧱 Cement & Steel', desc: 'Construction Bags & TMT Iron Rods', units: '36 Bags / Bundles', weight: 1800, fleet: '6W' }
];

function getHubCoords(hubName) {
  return BENGALURU_HUBS.find((h) => h.name === hubName) || BENGALURU_HUBS[0];
}

function getFleetMaxWeight(fleetId) {
  const f = FLEET_TYPES.find((item) => item.id === fleetId);
  return f ? f.maxWeight : 1500;
}

function calculateCoordsDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function calculateDistanceKm(hubNameA, hubNameB) {
  const hA = getHubCoords(hubNameA);
  const hB = getHubCoords(hubNameB);
  return calculateCoordsDistanceKm(hA.lat, hA.lng, hB.lat, hB.lng);
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
  const [idleVehicles, setIdleVehicles] = useState([]);

  // Driver Passed / Skipped Loads State (So drivers can reject/hide loads they don't want)
  const [passedBookingIds, setPassedBookingIds] = useState([]);
  const [skippedCoLoadIds, setSkippedCoLoadIds] = useState([]);

  // Customer State
  const [customerName, setCustomerName] = useState('Prateek Traders & Hardware');
  const [pickupHub, setPickupHub] = useState(BENGALURU_HUBS[0].name);
  const [dropHub, setDropHub] = useState(BENGALURU_HUBS[3].name);
  const [cargoType, setCargoType] = useState('Hardware & Electrical Cartons');
  const [packageUnits, setPackageUnits] = useState('12 Cartons');
  const [weightKg, setWeightKg] = useState(150);
  const [selectedFleet, setSelectedFleet] = useState('3W');
  const [manualFleetOverride, setManualFleetOverride] = useState(false);
  const [customFare, setCustomFare] = useState(380);
  const [ewayBill, setEwayBill] = useState('');

  // Shared Cargo Pooling & Insurance
  const [isSharedLoad, setIsSharedLoad] = useState(true);
  const [selectedPoolGroupId, setSelectedPoolGroupId] = useState(null);
  const [hasInsurance, setHasInsurance] = useState(false);
  const [directDispatchDriver, setDirectDispatchDriver] = useState(null);

  // Driver & Digital Tempo Stand State
  const [driverBaseHub, setDriverBaseHub] = useState(BENGALURU_HUBS[3].name);
  const [preferredReturnHub, setPreferredReturnHub] = useState(BENGALURU_HUBS[0].name);
  const [isDriverListedIdle, setIsDriverListedIdle] = useState(false);
  const [radiusFilterKm, setRadiusFilterKm] = useState(25);
  const [bidInputs, setBidInputs] = useState({});
  const [customerCounterInputs, setCustomerCounterInputs] = useState({});
  const [driverRecounterInputs, setDriverRecounterInputs] = useState({});
  const [otpInputs, setOtpInputs] = useState({});
  const [receiverInputs, setReceiverInputs] = useState({});
  const [statusMessage, setStatusMessage] = useState('');

  const activeFleetObj = FLEET_TYPES.find((f) => f.id === selectedFleet) || FLEET_TYPES[1];
  const utilizationPct = Math.min(100, Math.max(5, Math.round((weightKg / activeFleetObj.maxWeight) * 100)));

  useEffect(() => {
    let fleetObj = FLEET_TYPES.find((f) => f.id === selectedFleet) || FLEET_TYPES[1];
    if (!manualFleetOverride) {
      fleetObj = FLEET_TYPES.find((f) => weightKg <= f.maxWeight) || FLEET_TYPES[FLEET_TYPES.length - 1];
      setSelectedFleet(fleetObj.id);
    }

    const distKm = calculateDistanceKm(pickupHub, dropHub);
    let baseCalc = Math.round((fleetObj.baseFare + Math.max(4, distKm) * fleetObj.perKm) / 10) * 10;

    if (isSharedLoad) {
      baseCalc = Math.round((baseCalc * 0.7) / 10) * 10;
    }
    if (hasInsurance) {
      baseCalc += 49;
    }

    setCustomFare(baseCalc);
  }, [weightKg, pickupHub, dropHub, selectedFleet, manualFleetOverride, isSharedLoad, hasInsurance]);

  const applySmartCargoPreset = (preset) => {
    setManualFleetOverride(true);
    setCargoType(preset.desc);
    setPackageUnits(preset.units);
    setWeightKg(preset.weight);
    setSelectedFleet(preset.fleet);
    setStatusMessage(`✨ Preset Loaded: ${preset.desc} (${preset.weight} kg • ${preset.units})`);
    setTimeout(() => setStatusMessage(''), 3500);
  };

  const handleWeightChange = (val) => {
    const cleanWeight = Math.max(1, Math.min(10000, Number(val) || 1));
    setManualFleetOverride(false);
    setWeightKg(cleanWeight);
  };

  const handleManualFleetSelect = (fleetId) => {
    setManualFleetOverride(true);
    setSelectedFleet(fleetId);
  };

  const fetchLiveCloudData = async () => {
    setLoading(true);
    const { data: bData, error: bErr } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);

    const { data: bidData } = await supabase.from('bids').select('*').order('created_at', { ascending: true });
    const { data: idleData } = await supabase
      .from('idle_vehicles')
      .select('*')
      .eq('is_idle', true)
      .order('updated_at', { ascending: false });

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

    if (idleData) {
      setIdleVehicles(idleData);
      const myIdleRecord = idleData.find((v) => v.rc_number === rcNumber);
      setIsDriverListedIdle(Boolean(myIdleRecord));
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'idle_vehicles' }, () => fetchLiveCloudData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userSession, rcNumber]);

  // Automatic real-time hardware GPS tracker
  useEffect(() => {
    if (!userSession || mode !== 'driver' || !navigator.geolocation) return;

    const activeTrips = bookings.filter((b) => b.status === 'accepted' || b.status === 'in_transit');
    if (activeTrips.length === 0) return;

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const liveLat = Number(pos.coords.latitude.toFixed(5));
        const liveLng = Number(pos.coords.longitude.toFixed(5));

        for (const trip of activeTrips) {
          const pHub = getHubCoords(trip.pickup_hub);
          const dHub = getHubCoords(trip.drop_hub);
          const totalDist = Math.max(1, calculateCoordsDistanceKm(pHub.lat, pHub.lng, dHub.lat, dHub.lng));
          const remDist = calculateCoordsDistanceKm(liveLat, liveLng, dHub.lat, dHub.lng);
          const calcProgress = Math.min(95, Math.max(10, Math.round(((totalDist - remDist) / totalDist) * 100)));

          await supabase.from('bookings').update({
            driver_lat: liveLat,
            driver_lng: liveLng,
            route_progress: calcProgress,
            last_gps_ping: new Date().toISOString()
          }).eq('id', trip.id);
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [userSession, mode, bookings.length]);

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

  const handleToggleDriverIdleStand = async () => {
    const nextState = !isDriverListedIdle;
    const is4W = verifiedVehicleModel.toLowerCase().includes('4w') || verifiedVehicleModel.toLowerCase().includes('ace');
    const vCat = is4W ? '4W' : '3W';
    const maxCap = is4W ? 1500 : 500;

    const { error } = await supabase.from('idle_vehicles').upsert(
      [
        {
          driver_name: driverNameInput,
          driver_phone: userSession,
          rc_number: rcNumber,
          vehicle_model: verifiedVehicleModel,
          vehicle_category: vCat,
          current_stand_hub: driverBaseHub,
          preferred_return_hub: preferredReturnHub,
          available_capacity_kg: maxCap,
          base_rate_per_km: is4W ? 26 : 19,
          is_idle: nextState,
          updated_at: new Date().toISOString()
        }
      ],
      { onConflict: 'rc_number' }
    );

    if (!error) {
      setIsDriverListedIdle(nextState);
      setStatusMessage(
        nextState
          ? `🟢 Your ${verifiedVehicleModel} is now listed LIVE at ${driverBaseHub} Stand!`
          : `🔴 Vehicle removed from Idle Stand Radar.`
      );
      setTimeout(() => setStatusMessage(''), 4000);
      fetchLiveCloudData();
    } else {
      alert('Idle Stand Error: ' + error.message);
    }
  };

  const handleSelectIdleVehicleForBooking = (vehicle) => {
    setPickupHub(vehicle.current_stand_hub);
    if (vehicle.preferred_return_hub && BENGALURU_HUBS.some((h) => h.name === vehicle.preferred_return_hub)) {
      setDropHub(vehicle.preferred_return_hub);
    }
    setManualFleetOverride(true);
    setSelectedFleet(vehicle.vehicle_category);
    setDirectDispatchDriver(vehicle);
    setStatusMessage(
      `🚛 Pre-Selected Idle Vehicle: ${vehicle.driver_name} (${vehicle.rc_number}) at ${vehicle.current_stand_hub}!`
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const availableCorridorPools = (() => {
    const poolsMap = {};
    bookings.forEach((b) => {
      if (
        b.is_shared_load &&
        b.status !== 'delivered' &&
        b.status !== 'cancelled' &&
        b.pickup_hub === pickupHub &&
        b.drop_hub === dropHub &&
        b.pool_group_id
      ) {
        if (!poolsMap[b.pool_group_id]) {
          poolsMap[b.pool_group_id] = {
            poolId: b.pool_group_id,
            vehicleCategory: b.vehicle_category,
            maxCapacityKg: getFleetMaxWeight(b.vehicle_category),
            usedWeightKg: 0,
            orders: [],
            driverName: b.driver_name,
            driverVehicle: b.driver_vehicle,
            status: b.status
          };
        }
        poolsMap[b.pool_group_id].usedWeightKg += Number(b.weight_kg || 0);
        poolsMap[b.pool_group_id].orders.push(b);
      }
    });
    return Object.values(poolsMap).filter((p) => p.usedWeightKg + Number(weightKg) <= p.maxCapacityKg);
  })();

  const handleBroadcastLoad = async (e) => {
    e.preventDefault();
    if (pickupHub === dropHub) {
      alert('Please select different Pickup and Drop hubs.');
      return;
    }
    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const startCoords = getHubCoords(pickupHub);
    const fullCargoLabel = packageUnits ? `${cargoType} (${packageUnits})` : cargoType;

    const activePoolId = isSharedLoad
      ? selectedPoolGroupId || `POOL-${pickupHub.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`
      : null;

    const existingPoolObj = availableCorridorPools.find((p) => p.poolId === selectedPoolGroupId);
    const inheritedDriver = existingPoolObj && existingPoolObj.driverName ? existingPoolObj : null;

    const payload = {
      customer_name: customerName,
      customer_phone: userSession,
      pickup_hub: pickupHub,
      drop_hub: dropHub,
      cargo_type: fullCargoLabel,
      package_units: packageUnits || 'Custom Lot',
      weight_kg: Number(weightKg),
      vehicle_category: existingPoolObj ? existingPoolObj.vehicleCategory : selectedFleet,
      offered_fare: Number(customFare),
      status: directDispatchDriver || inheritedDriver ? 'accepted' : 'broadcasting',
      agreed_fare: directDispatchDriver || inheritedDriver ? Number(customFare) : null,
      driver_name: directDispatchDriver
        ? directDispatchDriver.driver_name
        : inheritedDriver
        ? inheritedDriver.driverName
        : null,
      driver_vehicle: directDispatchDriver
        ? `${directDispatchDriver.rc_number} • ${directDispatchDriver.vehicle_model}`
        : inheritedDriver
        ? inheritedDriver.driverVehicle
        : null,
      driver_upi: directDispatchDriver
        ? `${directDispatchDriver.driver_name.toLowerCase().replace(/\s+/g, '')}@ybl`
        : null,
      pickup_otp: generatedOtp,
      eway_bill_no: ewayBill || null,
      pod_status: selectedPoolGroupId ? `CLUBBED_IN_${selectedPoolGroupId}` : 'AWAITING_PICKUP',
      driver_lat: startCoords.lat,
      driver_lng: startCoords.lng,
      route_progress: directDispatchDriver || inheritedDriver ? 10 : 0,
      is_shared_load: isSharedLoad,
      truck_utilization_pct: utilizationPct,
      has_insurance: hasInsurance,
      pool_group_id: activePoolId
    };

    const { error } = await supabase.from('bookings').insert([payload]);

    if (!error) {
      if (directDispatchDriver) {
        await supabase.from('idle_vehicles').update({ is_idle: false }).eq('rc_number', directDispatchDriver.rc_number);
        setStatusMessage(`✅ Directly Dispatched Idle Vehicle ${directDispatchDriver.rc_number}!`);
        setDirectDispatchDriver(null);
      } else if (selectedPoolGroupId) {
        setStatusMessage(`🤝 Order Clubbed into Shared Truck Pool ${selectedPoolGroupId}! Combined Deck Space Updated.`);
        setSelectedPoolGroupId(null);
      } else {
        setStatusMessage(
          isSharedLoad
            ? `🤝 Shared Pool ${activePoolId} Created! Other shippers & drivers can now stack loads onto this truck.`
            : 'Load broadcasted & Auto-Dispatched to Bengaluru WhatsApp Driver Groups!'
        );
      }
      setTimeout(() => setStatusMessage(''), 4500);
      fetchLiveCloudData();
    } else {
      alert('Broadcast error: ' + error.message);
    }
  };

  // ============================================================================
  // COMPLETE REJECTION, PASSING, UN-CLUBBING & CANCELLATION ENGINE
  // ============================================================================

  // 1. Customer rejects a Driver's Bid
  const handleCustomerRejectBid = async (bid) => {
    await supabase.from('bids').update({
      status: 'rejected_by_customer',
      last_offered_by: 'customer'
    }).eq('id', bid.id);
    setStatusMessage(`❌ Rejected quote of ₹${bid.bid_amount} from ${bid.driver_name}.`);
    setTimeout(() => setStatusMessage(''), 3500);
    fetchLiveCloudData();
  };

  // 2. Driver rejects Customer's Counter-Offer or withdraws their own Bid
  const handleDriverWithdrawOrRejectBid = async (bid, isRejectingCounter = false) => {
    await supabase.from('bids').update({
      status: isRejectingCounter ? 'counter_rejected_by_driver' : 'withdrawn_by_driver',
      last_offered_by: 'driver'
    }).eq('id', bid.id);
    setStatusMessage(
      isRejectingCounter
        ? `❌ Rejected Lister's counter-offer of ₹${bid.customer_counter}. You can submit a new quote anytime.`
        : `🗑️ Bid of ₹${bid.bid_amount} withdrawn.`
    );
    setTimeout(() => setStatusMessage(''), 3500);
    fetchLiveCloudData();
  };

  // 3. Driver passes / declines an open load on their Radar
  const handleDriverPassLoad = (bookingId) => {
    setPassedBookingIds((prev) => [...prev, bookingId]);
    setStatusMessage('⏭️ Load passed and hidden from your radar. Click "Restore Passed Loads" anytime to view it again.');
    setTimeout(() => setStatusMessage(''), 3500);
  };

  // 4. Customer cancels an open broadcasting load
  const handleCustomerCancelBooking = async (bookingId) => {
    await supabase.from('bookings').delete().eq('id', bookingId);
    setStatusMessage('🗑️ Load broadcast cancelled and removed from radar.');
    setTimeout(() => setStatusMessage(''), 3500);
    fetchLiveCloudData();
  };

  // 5. Either Customer or Driver releases/unassigns an 'accepted' load (or declines a Direct Stand Dispatch) back to open 'broadcasting'
  const handleReleaseAcceptedLoad = async (booking, releasedByRole) => {
    await supabase.from('bookings').update({
      status: 'broadcasting',
      agreed_fare: null,
      driver_name: null,
      driver_vehicle: null,
      driver_upi: null,
      pod_status: 'REOPENED_FOR_BIDDING',
      route_progress: 0
    }).eq('id', booking.id);

    // If driver declined a direct stand dispatch, put their vehicle back on the Idle Stand automatically
    if (releasedByRole === 'driver') {
      await supabase.from('idle_vehicles').update({ is_idle: true }).eq('rc_number', rcNumber);
    }

    setStatusMessage(
      releasedByRole === 'driver'
        ? '🔄 Load released back to open radar & your vehicle is back on the Idle Stand.'
        : '🔄 Driver unassigned. Load is now broadcasting to all drivers again!'
    );
    setTimeout(() => setStatusMessage(''), 4000);
    fetchLiveCloudData();
  };

  // 6. Un-club / Remove a secondary order from a shared truck pool
  const handleRemoveOrderFromPool = async (ord) => {
    await supabase.from('bookings').update({
      pool_group_id: null,
      status: 'broadcasting',
      agreed_fare: null,
      driver_name: null,
      driver_vehicle: null,
      pod_status: 'UNCLUBBED_STANDALONE'
    }).eq('id', ord.id);
    setStatusMessage(`🔓 Removed "${ord.customer_name}" (${ord.weight_kg} kg) from shared truck pool.`);
    setTimeout(() => setStatusMessage(''), 3500);
    fetchLiveCloudData();
  };

  const handleDriverClubOrderIntoPool = async (primaryBooking, secondaryBooking) => {
    const poolId =
      primaryBooking.pool_group_id ||
      `POOL-${primaryBooking.pickup_hub.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    await supabase
      .from('bookings')
      .update({
        pool_group_id: poolId,
        is_shared_load: true
      })
      .eq('id', primaryBooking.id);

    await supabase
      .from('bookings')
      .update({
        status: primaryBooking.status,
        agreed_fare: secondaryBooking.offered_fare,
        driver_name: driverNameInput,
        driver_vehicle: `${rcNumber} • ${verifiedVehicleModel}`,
        driver_upi: `${driverNameInput.toLowerCase().replace(/\s+/g, '')}@ybl`,
        pool_group_id: poolId,
        is_shared_load: true,
        pod_status: `CLUBBED_ON_TRUCK_${rcNumber}`,
        driver_lat: primaryBooking.driver_lat,
        driver_lng: primaryBooking.driver_lng,
        route_progress: primaryBooking.route_progress || 10
      })
      .eq('id', secondaryBooking.id);

    setStatusMessage(
      `📦 Stacked "${secondaryBooking.cargo_type}" (${secondaryBooking.weight_kg} kg) onto your truck! You now earn both fares on 1 trip.`
    );
    setTimeout(() => setStatusMessage(''), 4500);
    fetchLiveCloudData();
  };

  const handleSimulateSecondPoolOrder = async (baseBooking) => {
    const maxCap = getFleetMaxWeight(baseBooking.vehicle_category);
    const sampleWeight = Math.min(200, Math.max(40, Math.round(maxCap * 0.28)));
    const samplePct = Math.round((sampleWeight / maxCap) * 100);
    const distKm = calculateDistanceKm(baseBooking.pickup_hub, baseBooking.drop_hub);
    const sampleFare = Math.round((150 + distKm * 15) / 10) * 10;
    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const startCoords = getHubCoords(baseBooking.pickup_hub);

    const merchants = ['Sri Lakshmi Electricals', 'Peenya Precision Gears', 'Nandi Hardware & Tools', 'Balaji Textiles & Co.'];
    const randomMerchant = merchants[Math.floor(Math.random() * merchants.length)];

    await supabase.from('bookings').insert([
      {
        customer_name: randomMerchant,
        customer_phone: userSession,
        pickup_hub: baseBooking.pickup_hub,
        drop_hub: baseBooking.drop_hub,
        cargo_type: `Co-Loader Parcel: ${randomMerchant} (6 Boxes)`,
        package_units: '6 Boxes',
        weight_kg: sampleWeight,
        vehicle_category: baseBooking.vehicle_category,
        offered_fare: sampleFare,
        status: 'broadcasting',
        pickup_otp: generatedOtp,
        pod_status: 'PART_LOAD_READY_TO_STACK',
        driver_lat: startCoords.lat,
        driver_lng: startCoords.lng,
        route_progress: 0,
        is_shared_load: true,
        truck_utilization_pct: samplePct,
        has_insurance: true
      }
    ]);

    setStatusMessage(
      `➕ Spawned "${randomMerchant}" (${sampleWeight} kg / ${samplePct}% Deck Space) on ${baseBooking.pickup_hub.split('/')[0]} → ${baseBooking.drop_hub.split('/')[0]}!`
    );
    setTimeout(() => setStatusMessage(''), 4500);
    fetchLiveCloudData();
  };

  const handleCreateSampleReturnLoad = async (originHub, targetReturnHub) => {
    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const startCoords = getHubCoords(originHub);
    const distKm = calculateDistanceKm(originHub, targetReturnHub);
    const estFare = Math.round((320 + Math.max(4, distKm) * 24) / 10) * 10;

    await supabase.from('bookings').insert([
      {
        customer_name: 'Bengaluru Industrial Backhaul Co.',
        customer_phone: userSession,
        pickup_hub: originHub,
        drop_hub: targetReturnHub,
        cargo_type: 'Return Backhaul: Machined Castings (8 Crates)',
        package_units: '8 Crates',
        weight_kg: 180,
        vehicle_category: '3W',
        offered_fare: estFare,
        status: 'broadcasting',
        pickup_otp: generatedOtp,
        pod_status: 'RETURN_BACKHAUL_LOAD',
        driver_lat: startCoords.lat,
        driver_lng: startCoords.lng,
        route_progress: 0,
        is_shared_load: true,
        truck_utilization_pct: 36,
        has_insurance: true
      }
    ]);
    setStatusMessage(`🔄 Return Backhaul Load Created from ${originHub} → ${targetReturnHub}!`);
    setTimeout(() => setStatusMessage(''), 4000);
    fetchLiveCloudData();
  };

  const handleDriverDirectAccept = async (booking) => {
    const startCoords = getHubCoords(booking.pickup_hub);
    const poolId =
      booking.pool_group_id ||
      (booking.is_shared_load
        ? `POOL-${booking.pickup_hub.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`
        : null);

    await supabase.from('bookings').update({
      status: 'accepted',
      agreed_fare: booking.offered_fare,
      driver_name: driverNameInput,
      driver_vehicle: `${rcNumber} • ${verifiedVehicleModel}`,
      driver_upi: `${driverNameInput.toLowerCase().replace(/\s+/g, '')}@ybl`,
      pod_status: 'DRIVER_ASSIGNED',
      driver_lat: startCoords.lat,
      driver_lng: startCoords.lng,
      route_progress: 10,
      pool_group_id: poolId,
      last_gps_ping: new Date().toISOString()
    }).eq('id', booking.id);

    await supabase.from('idle_vehicles').update({ is_idle: false }).eq('rc_number', rcNumber);

    setStatusMessage(`✅ Load Accepted at ₹${booking.offered_fare}!`);
    setTimeout(() => setStatusMessage(''), 4000);
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
      bid_amount: amount,
      last_offered_by: 'driver',
      status: 'active'
    }]);
    setBidInputs({ ...bidInputs, [bookingId]: '' });
    setStatusMessage(`💬 Counter-Bid of ₹${amount} sent to Shopkeeper!`);
    setTimeout(() => setStatusMessage(''), 3000);
    fetchLiveCloudData();
  };

  const handleCustomerCounterOffer = async (bid) => {
    const counterAmt = Number(customerCounterInputs[bid.id]);
    if (!counterAmt) return;
    await supabase.from('bids').update({
      customer_counter: counterAmt,
      last_offered_by: 'customer',
      status: 'active'
    }).eq('id', bid.id);
    setCustomerCounterInputs({ ...customerCounterInputs, [bid.id]: '' });
    setStatusMessage(`🤝 Counter-offer of ₹${counterAmt} sent back to ${bid.driver_name}!`);
    setTimeout(() => setStatusMessage(''), 3500);
    fetchLiveCloudData();
  };

  const handleDriverRecounterOffer = async (bid) => {
    const newDriverAmt = Number(driverRecounterInputs[bid.id]);
    if (!newDriverAmt) return;
    await supabase.from('bids').update({
      bid_amount: newDriverAmt,
      last_offered_by: 'driver',
      status: 'active'
    }).eq('id', bid.id);
    setDriverRecounterInputs({ ...driverRecounterInputs, [bid.id]: '' });
    setStatusMessage(`💬 Updated Driver Quote of ₹${newDriverAmt} sent to Shopkeeper!`);
    setTimeout(() => setStatusMessage(''), 3500);
    fetchLiveCloudData();
  };

  const handleLockAgreedBid = async (booking, bid, finalAgreedAmount) => {
    const startCoords = getHubCoords(booking.pickup_hub);
    await supabase.from('bookings').update({
      status: 'accepted',
      agreed_fare: Number(finalAgreedAmount),
      driver_name: bid.driver_name,
      driver_vehicle: bid.vehicle_number,
      driver_upi: bid.driver_upi,
      pod_status: 'DRIVER_ASSIGNED',
      driver_lat: startCoords.lat,
      driver_lng: startCoords.lng,
      route_progress: 10,
      last_gps_ping: new Date().toISOString()
    }).eq('id', booking.id);
    setStatusMessage(`🤝 Deal Locked at ₹${finalAgreedAmount} with ${bid.driver_name}!`);
    setTimeout(() => setStatusMessage(''), 4000);
    fetchLiveCloudData();
  };

  const handleVerifyPickupOtp = async (booking) => {
    if ((otpInputs[booking.id] || '').trim() !== booking.pickup_otp) {
      alert(`Incorrect OTP! Hint: ${booking.pickup_otp}`);
      return;
    }
    const startCoords = getHubCoords(booking.pickup_hub);
    await supabase.from('bookings').update({
      status: 'in_transit',
      pod_status: 'IN_TRANSIT_LIVE_GPS',
      driver_lat: startCoords.lat,
      driver_lng: startCoords.lng,
      route_progress: 25,
      last_gps_ping: new Date().toISOString()
    }).eq('id', booking.id);
    fetchLiveCloudData();
  };

  const handleDeliver = async (booking) => {
    const receiverName = (receiverInputs[booking.id] || '').trim() || 'Verified Hub Manager';
    const dHub = getHubCoords(booking.drop_hub);
    const timestamp = new Date().toISOString();
    await supabase.from('bookings').update({
      status: 'delivered',
      delivered_at: timestamp,
      driver_lat: dHub.lat,
      driver_lng: dHub.lng,
      route_progress: 100,
      last_gps_ping: timestamp,
      pod_status: `SIGNED_BY_${receiverName.toUpperCase()}`
    }).eq('id', booking.id);
    setStatusMessage('Official Digital Bilty & Proof of Delivery Generated!');
    setTimeout(() => setStatusMessage(''), 4000);
    fetchLiveCloudData();
  };

  const openGoogleMapsRoute = (originHub, destHub) => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originHub + ', Bengaluru')}&destination=${encodeURIComponent(destHub + ', Bengaluru')}&travelmode=driving`,
      '_blank'
    );
  };

  const shareOnWhatsApp = (b) => {
    const text = `🚨 *NAMMA CARGO LOAD ALERT* 🚨\n\n📦 *Cargo:* ${b.cargo_type} (${b.weight_kg} kg)\n📍 *Pickup:* ${b.pickup_hub}\n🎯 *Drop:* ${b.drop_hub}\n💰 *Fare:* ₹${b.agreed_fare || b.offered_fare}\n🚛 *Vehicle:* ${b.vehicle_category} Needed\n\nAccept instantly on NammaCargo App!`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const filteredDriverBookings = bookings.filter((b) => {
    if (passedBookingIds.includes(b.id)) return false;
    if (b.status !== 'broadcasting') return true;
    return calculateDistanceKm(driverBaseHub, b.pickup_hub) <= radiusFilterKm;
  });

  const segmentColors = ['bg-emerald-400', 'bg-cyan-400', 'bg-amber-400', 'bg-purple-400'];

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
            <p className="text-xs text-slate-400">Bengaluru's Zero-Commission Logistics Utilization Engine</p>
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
  // 2. RENDER DRIVER KYC SCREEN
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

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
              <span className="text-[11px] text-slate-400 font-bold block">
                Click any preset RC below to test your live Supabase RTO Database rules:
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
  // 3. MAIN APP INTERFACE (CUSTOMER & DRIVER RADAR)
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
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl h-fit">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-amber-400" /> Broadcast Cargo Load
              </h2>

              {directDispatchDriver && (
                <div className="mb-4 bg-emerald-500/15 border border-emerald-500 p-3 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <span className="text-emerald-300 font-black block">
                      ⚡ DIRECT STAND DISPATCH ACTIVE
                    </span>
                    <span className="text-white">
                      {directDispatchDriver.driver_name} ({directDispatchDriver.rc_number})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDirectDispatchDriver(null)}
                    className="text-rose-300 hover:underline font-bold cursor-pointer"
                  >
                    ✕ Cancel Direct Dispatch
                  </button>
                </div>
              )}

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
                    onChange={(e) => { setPickupHub(e.target.value); setSelectedPoolGroupId(null); }}
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
                    onChange={(e) => { setDropHub(e.target.value); setSelectedPoolGroupId(null); }}
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

                <div className="bg-slate-950 p-3 rounded-xl border border-amber-500/30 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Quick Presets OR Custom Entry Below
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCargoType('');
                        setPackageUnits('');
                        setWeightKg(100);
                        setManualFleetOverride(false);
                      }}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-cyan-300 px-2 py-0.5 rounded font-bold cursor-pointer"
                    >
                      ✏️ Clear for Custom Entry
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {SMART_CARGO_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => applySmartCargoPreset(preset)}
                        className="text-[11px] bg-slate-900 hover:bg-amber-500/20 border border-slate-700 hover:border-amber-500/50 text-slate-200 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                      >
                        {preset.label} <span className="text-amber-400 font-bold">({preset.weight}kg)</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-xs text-slate-400 block mb-1">Custom Cargo Description</label>
                    <input
                      type="text"
                      placeholder="e.g., CNC Spindles, Textiles, Plywood..."
                      value={cargoType}
                      onChange={(e) => setCargoType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Units / Dimensions</label>
                    <input
                      type="text"
                      placeholder="e.g., 10 Boxes / 6ft"
                      value={packageUnits}
                      onChange={(e) => setPackageUnits(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                    />
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <label className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-amber-400" /> Custom Weight (Type Exact kg or Slide):
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="1"
                        max="10000"
                        value={weightKg}
                        onChange={(e) => handleWeightChange(e.target.value)}
                        className="bg-slate-900 border border-amber-500/60 rounded-lg px-2.5 py-1 text-sm font-black text-amber-400 w-24 text-right"
                        required
                      />
                      <span className="text-xs font-bold text-slate-400">kg</span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="5"
                    max="5000"
                    step="5"
                    value={Math.min(5000, weightKg)}
                    onChange={(e) => handleWeightChange(e.target.value)}
                    className="w-full accent-amber-500 cursor-pointer"
                  />

                  <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">
                        {manualFleetOverride ? 'Manual Vehicle Override Active:' : 'Auto-Matched Vehicle (Click to Override):'}
                      </span>
                      <span className="text-emerald-400 font-bold">{selectedFleet} Selected ({utilizationPct}% Deck Space)</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {FLEET_TYPES.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => handleManualFleetSelect(f.id)}
                          className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                            selectedFleet === f.id
                              ? 'bg-amber-500/20 border-amber-400 text-white'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="text-xs font-black text-amber-400">{f.id}</div>
                          <div className="text-[10px] truncate">{f.badge}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 bg-slate-950 p-3.5 rounded-xl border border-cyan-500/40">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                      <Layers className="w-4 h-4" /> Your Cargo Deck Footprint: {utilizationPct}%
                    </span>
                    <span className="text-[11px] text-emerald-300 font-semibold">
                      {100 - utilizationPct}% Space Free to Club
                    </span>
                  </div>

                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-full transition-all duration-300"
                      style={{ width: `${utilizationPct}%` }}
                    />
                  </div>

                  <label className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800 cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-emerald-300 block">
                        🤝 Enable Shared Truck Clubbing (Save 30% Fare)
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Allow driver to club your {weightKg} kg load with other shippers on this route
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSharedLoad}
                      onChange={(e) => {
                        setIsSharedLoad(e.target.checked);
                        if (!e.target.checked) setSelectedPoolGroupId(null);
                      }}
                      className="w-4 h-4 accent-emerald-500 cursor-pointer"
                    />
                  </label>

                  {isSharedLoad && availableCorridorPools.length > 0 && (
                    <div className="bg-cyan-500/10 border border-cyan-500/40 rounded-xl p-2.5 space-y-2 text-xs">
                      <div className="font-bold text-cyan-300 flex items-center gap-1">
                        🚛 Active Shared Truck Pools on {pickupHub.split('/')[0]} → {dropHub.split('/')[0]}:
                      </div>
                      {availableCorridorPools.map((pool) => {
                        const usedPct = Math.round((pool.usedWeightKg / pool.maxCapacityKg) * 100);
                        const combinedPct = Math.min(100, usedPct + utilizationPct);
                        const isJoined = selectedPoolGroupId === pool.poolId;

                        return (
                          <div
                            key={pool.poolId}
                            className={`p-2.5 rounded-lg border transition ${
                              isJoined
                                ? 'bg-emerald-500/20 border-emerald-400'
                                : 'bg-slate-900 border-slate-800'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-black text-white">
                                {pool.poolId} ({pool.vehicleCategory} • {pool.orders.length} Order{pool.orders.length > 1 ? 's' : ''})
                              </span>
                              <span className="text-[10px] bg-cyan-500/20 text-cyan-200 px-2 py-0.5 rounded font-bold">
                                {usedPct}% Used + Your {utilizationPct}% = {combinedPct}% Full
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-1">
                              Current Load: {pool.usedWeightKg} / {pool.maxCapacityKg} kg ({pool.maxCapacityKg - pool.usedWeightKg} kg free)
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedPoolGroupId(isJoined ? null : pool.poolId)}
                              className={`mt-2 w-full py-1.5 rounded-lg font-black text-xs cursor-pointer transition ${
                                isJoined
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                  : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40'
                              }`}
                            >
                              {isJoined
                                ? `✕ Leave Truck Pool ${pool.poolId} (Book Standalone Instead)`
                                : `🔗 Club My Load Into ${pool.poolId}`}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <label className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800 cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5" /> Add ₹49 Transit Damage Insurance
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Covers up to ₹2,00,000 cargo value on Digital Bilty
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={hasInsurance}
                      onChange={(e) => setHasInsurance(e.target.checked)}
                      className="w-4 h-4 accent-amber-500 cursor-pointer"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">0% Commission Fare (₹)</label>
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
                      placeholder="EWB-291048291"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  <Truck className="w-5 h-5" />
                  {selectedPoolGroupId
                    ? `Club Order Into ${selectedPoolGroupId} (₹${customFare})`
                    : directDispatchDriver
                    ? `Direct Dispatch ${directDispatchDriver.rc_number} (₹${customFare})`
                    : `Broadcast Load (₹${customFare})`}
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 space-y-6">
              {/* LIVE DIGITAL TEMPO STAND */}
              <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 space-y-3 shadow-xl">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <div>
                    <h2 className="text-base font-black text-white flex items-center gap-2">
                      <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                      Digital Tempo Stand ({idleVehicles.length} Verified Idle Vehicles Waiting)
                    </h2>
                    <p className="text-xs text-slate-400">
                      Book an idle commercial vehicle parked at a Bengaluru hub with 1 tap
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {idleVehicles.map((v) => (
                    <div
                      key={v.rc_number}
                      className="bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-3.5 space-y-2 transition"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-black text-[10px]">
                            🟢 IDLE AT STAND • {v.vehicle_category}
                          </span>
                          <div className="font-bold text-white text-xs mt-1">{v.driver_name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{v.rc_number} • {v.vehicle_model}</div>
                        </div>
                        <span className="text-xs font-black text-amber-400">₹{v.base_rate_per_km}/km</span>
                      </div>

                      <div className="text-[11px] space-y-0.5 text-slate-300 bg-slate-900 p-2 rounded-lg">
                        <div>📍 <b>Parked At:</b> {v.current_stand_hub}</div>
                        <div>🎯 <b>Preferred Direction:</b> {v.preferred_return_hub}</div>
                        <div>📦 <b>Free Deck Capacity:</b> {v.available_capacity_kg} kg</div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectIdleVehicleForBooking(v)}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-1.5 rounded-lg text-xs cursor-pointer transition"
                      >
                        ⚡ Direct Dispatch This Vehicle
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-400" /> Active Shipments ({bookings.length})
                </h2>

                {bookings.map((b) => {
                  const bids = bidsByBooking[b.id] || [];
                  const upiUri = `upi://pay?pa=${b.driver_upi || 'rajugowda@ybl'}&pn=${encodeURIComponent(b.driver_name || 'Driver')}&am=${b.agreed_fare || b.offered_fare}&cu=INR`;
                  const dist = calculateDistanceKm(b.pickup_hub, b.drop_hub);
                  const biltyCode = `NC-BLR-${String(b.id).slice(0, 6).toUpperCase()}`;
                  const dHub = getHubCoords(b.drop_hub);
                  const vLat = b.driver_lat || getHubCoords(b.pickup_hub).lat;
                  const vLng = b.driver_lng || getHubCoords(b.pickup_hub).lng;
                  const liveRemKm = calculateCoordsDistanceKm(vLat, vLng, dHub.lat, dHub.lng);
                  const etaMins = Math.max(3, Math.round(liveRemKm * 2.4));

                  const clubbedPoolOrders = b.pool_group_id
                    ? bookings.filter((other) => other.pool_group_id === b.pool_group_id)
                    : [b];
                  const maxTruckKg = getFleetMaxWeight(b.vehicle_category);
                  const totalPoolKg = clubbedPoolOrders.reduce((acc, item) => acc + Number(item.weight_kg || 0), 0);
                  const totalPoolPct = Math.min(100, Math.round((totalPoolKg / maxTruckKg) * 100));
                  const totalPoolFare = clubbedPoolOrders.reduce((acc, item) => acc + Number(item.agreed_fare || item.offered_fare || 0), 0);

                  return (
                    <div key={b.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg">
                      <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-800 pb-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-black text-xs">
                            {b.vehicle_category}
                          </span>
                          <span className="font-bold text-white text-sm">{b.cargo_type} ({b.weight_kg} kg)</span>
                          {b.pool_group_id && (
                            <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded font-mono font-bold">
                              🔗 {b.pool_group_id} ({clubbedPoolOrders.length} Clubbed)
                            </span>
                          )}
                          {b.has_insurance && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-bold">
                              🛡️ ₹2L Insured
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => shareOnWhatsApp(b)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow"
                          >
                            <Share2 className="w-3.5 h-3.5" /> WhatsApp
                          </button>

                          {/* CUSTOMER CANCEL / UNASSIGN BUTTONS */}
                          {b.status === 'broadcasting' && (
                            <button
                              onClick={() => handleCustomerCancelBooking(b.id)}
                              className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Cancel Broadcast
                            </button>
                          )}
                          {b.status === 'accepted' && (
                            <button
                              onClick={() => handleReleaseAcceptedLoad(b, 'customer')}
                              className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" /> Unassign Driver
                            </button>
                          )}

                          <span className="text-xs font-bold px-2.5 py-1 rounded-full uppercase bg-amber-500/20 text-amber-300">
                            {b.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      {/* VISUAL MULTI-ORDER CONSOLIDATED TRUCK DECK BAR WITH UN-CLUB OPTION */}
                      {b.is_shared_load && (
                        <div className="bg-slate-950 border border-cyan-500/30 rounded-xl p-3 space-y-2 text-xs">
                          <div className="flex flex-wrap justify-between items-center gap-2">
                            <span className="text-cyan-300 font-bold flex items-center gap-1">
                              <Layers className="w-3.5 h-3.5" /> Consolidated Truck Deck ({clubbedPoolOrders.length} Shipper{clubbedPoolOrders.length > 1 ? 's' : ''} Clubbed):
                            </span>
                            <span className="font-mono text-emerald-300 font-bold">
                              {totalPoolKg} / {maxTruckKg} kg ({totalPoolPct}% Full • {100 - totalPoolPct}% Free)
                            </span>
                          </div>

                          <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden flex">
                            {clubbedPoolOrders.map((ord, idx) => {
                              const segPct = Math.max(5, Math.round((Number(ord.weight_kg) / maxTruckKg) * 100));
                              return (
                                <div
                                  key={ord.id}
                                  style={{ width: `${segPct}%` }}
                                  className={`${segmentColors[idx % segmentColors.length]} h-full border-r border-slate-950 transition-all duration-500`}
                                  title={`${ord.customer_name}: ${ord.weight_kg} kg (${segPct}%)`}
                                />
                              );
                            })}
                          </div>

                          <div className="flex flex-wrap gap-2 pt-1">
                            {clubbedPoolOrders.map((ord) => {
                              const segPct = Math.round((Number(ord.weight_kg) / maxTruckKg) * 100);
                              return (
                                <div
                                  key={ord.id}
                                  className="text-[10px] bg-slate-900 border border-slate-800 px-2 py-1 rounded flex items-center gap-2 text-slate-300"
                                >
                                  <span>
                                    <b className="text-white">{ord.customer_name}:</b> {ord.weight_kg}kg ({segPct}%) • ₹{ord.agreed_fare || ord.offered_fare}
                                  </span>
                                  {clubbedPoolOrders.length > 1 && b.status !== 'delivered' && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveOrderFromPool(ord)}
                                      className="text-rose-400 hover:text-rose-300 font-black cursor-pointer"
                                      title="Un-club this order from the shared pool"
                                    >
                                      ✕ Un-club
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

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

                      {(b.status === 'accepted' || b.status === 'in_transit') && (
                        <div className="bg-slate-950 border border-cyan-500/40 rounded-xl p-3.5 space-y-2.5">
                          <div className="flex flex-wrap justify-between items-center text-xs gap-2">
                            <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                              <LocateFixed className="w-4 h-4 animate-pulse" /> LIVE VEHICLE LOCATION & ROUTE MAP
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="text-amber-300 font-bold">
                                ETA: ~{etaMins} mins ({liveRemKm} km to Drop)
                              </span>
                              <button
                                onClick={() => openGoogleMapsRoute(b.pickup_hub, b.drop_hub)}
                                className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2.5 py-1 rounded-lg font-bold cursor-pointer flex items-center gap-1"
                              >
                                <Navigation className="w-3 h-3" /> Full Route Map
                              </button>
                            </div>
                          </div>

                          <div className="rounded-xl overflow-hidden border border-slate-800 h-44 w-full bg-slate-900">
                            <iframe
                              title={`live-map-${b.id}`}
                              width="100%"
                              height="100%"
                              style={{ border: 0 }}
                              loading="lazy"
                              src={`https://maps.google.com/maps?q=${vLat},${vLng}&z=13&output=embed`}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800">
                        <div>
                          <span className="text-xs text-slate-400">
                            {b.agreed_fare ? 'Your Locked Share Fare: ' : 'Your Offer Fare: '}
                          </span>
                          <span className="font-black text-amber-400 text-sm">₹{b.agreed_fare || b.offered_fare}</span>
                          {clubbedPoolOrders.length > 1 && (
                            <span className="text-[11px] text-emerald-400 font-bold ml-2">
                              (Combined Truck Pool Payout: ₹{totalPoolFare})
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="text-xs text-slate-400">Pickup OTP: </span>
                          <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">{b.pickup_otp}</span>
                        </div>
                      </div>

                      {/* CUSTOMER NEGOTIATION VIEW WITH ACCEPT, COUNTER, AND REJECT OPTIONS */}
                      {b.status === 'broadcasting' && bids.length > 0 && (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 space-y-2.5">
                          <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                            <ArrowLeftRight className="w-4 h-4" /> Live Fare Negotiation ({bids.length} Bid{bids.length > 1 ? 's' : ''}):
                          </div>
                          {bids.map((bid) => {
                            const isRejected = bid.status && bid.status !== 'active';
                            return (
                              <div
                                key={bid.id}
                                className={`bg-slate-950 border p-3 rounded-xl space-y-2.5 text-xs ${
                                  isRejected ? 'border-rose-500/30 opacity-75' : 'border-slate-800'
                                }`}
                              >
                                <div className="flex flex-wrap justify-between items-center gap-2">
                                  <div>
                                    <div className="font-bold text-white flex items-center gap-2">
                                      {bid.driver_name}
                                      {isRejected && (
                                        <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded text-[10px]">
                                          {bid.status.replaceAll('_', ' ').toUpperCase()}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-slate-400 text-[11px]">{bid.vehicle_number}</div>
                                  </div>
                                  <div className="text-right space-y-0.5">
                                    <div className="text-amber-400 font-black text-sm">
                                      Driver Quote: ₹{bid.bid_amount}
                                    </div>
                                    {bid.customer_counter && (
                                      <div className="text-cyan-300 font-bold text-[11px]">
                                        Your Counter: ₹{bid.customer_counter}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {!isRejected ? (
                                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleLockAgreedBid(b, bid, bid.bid_amount)}
                                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-3 py-1.5 rounded-lg cursor-pointer"
                                      >
                                        ✅ Accept ₹{bid.bid_amount}
                                      </button>
                                      <button
                                        onClick={() => handleCustomerRejectBid(bid)}
                                        className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                                      >
                                        ✕ Reject Quote
                                      </button>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="number"
                                        placeholder="Counter ₹"
                                        value={customerCounterInputs[bid.id] || ''}
                                        onChange={(e) => setCustomerCounterInputs({ ...customerCounterInputs, [bid.id]: e.target.value })}
                                        className="bg-slate-900 border border-cyan-500/50 rounded-lg px-2.5 py-1.5 text-white w-28 text-xs"
                                      />
                                      <button
                                        onClick={() => handleCustomerCounterOffer(bid)}
                                        className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black px-3 py-1.5 rounded-lg cursor-pointer"
                                      >
                                        Counter Back
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex justify-between items-center pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                                    <span>Offer declined. Send a fresh counter-offer to reopen negotiation:</span>
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="number"
                                        placeholder="New Counter ₹"
                                        value={customerCounterInputs[bid.id] || ''}
                                        onChange={(e) => setCustomerCounterInputs({ ...customerCounterInputs, [bid.id]: e.target.value })}
                                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white w-28 text-xs"
                                      />
                                      <button
                                        onClick={() => handleCustomerCounterOffer(bid)}
                                        className="bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 px-2.5 py-1 rounded-lg font-bold cursor-pointer"
                                      >
                                        Reopen with Counter
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {b.status === 'delivered' && (
                        <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-xl p-4 space-y-3">
                          <div className="flex justify-between items-start gap-3">
                            <div className="text-xs space-y-1">
                              <span className="text-emerald-400 font-black flex items-center gap-1.5 text-sm">
                                <FileCheck className="w-4 h-4" /> DIGITAL BILTY & POD: {biltyCode}
                              </span>
                              <div className="text-slate-200 font-semibold">
                                Carrier: {b.driver_name || driverNameInput} ({b.driver_vehicle || rcNumber})
                              </div>
                              <div className="text-slate-400">
                                POD Status: <span className="text-emerald-300 font-mono">{b.pod_status || 'VERIFIED_POD'}</span>
                              </div>
                              {b.has_insurance && (
                                <div className="text-amber-300 font-bold">
                                  🛡️ Transit Insurance Active: Covered up to ₹2,00,000
                                </div>
                              )}
                              <div className="text-[11px] text-slate-400 font-mono">
                                Delivered: {new Date(b.delivered_at || b.created_at || Date.now()).toLocaleString()}
                              </div>
                            </div>
                            <div className="bg-white p-2 rounded-xl text-center shrink-0">
                              <QRCodeSVG value={upiUri} size={72} />
                              <span className="text-[9px] text-slate-950 font-black block mt-1">0% Fee UPI Pay</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-4 h-fit">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-400" /> Driver Stand & Radius
                </h2>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Your Current Stand / Base Hub</label>
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
                    <label className="text-xs text-slate-400 block mb-1">Preferred Next Destination Corridor</label>
                    <select
                      value={preferredReturnHub}
                      onChange={(e) => setPreferredReturnHub(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    >
                      {BENGALURU_HUBS.map((h) => (
                        <option key={h.name} value={h.name}>{h.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-emerald-500/40 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-white">Digital Tempo Stand Status:</span>
                      <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
                        isDriverListedIdle ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {isDriverListedIdle ? '🟢 PARKED & IDLE' : '🔴 OFF-STAND'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Waiting empty at {driverBaseHub.split('/')[0]}? List your vehicle so nearby shopkeepers can dispatch you directly.
                    </p>
                    <button
                      type="button"
                      onClick={handleToggleDriverIdleStand}
                      className={`w-full font-black py-2.5 rounded-xl text-xs transition cursor-pointer ${
                        isDriverListedIdle
                          ? 'bg-rose-500/20 border border-rose-500/50 text-rose-300 hover:bg-rose-500/30'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg'
                      }`}
                    >
                      {isDriverListedIdle
                        ? '🔴 Remove My Vehicle from Idle Stand'
                        : '🟢 List My Vehicle as IDLE at Stand'}
                    </button>
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
            </div>

            <div className="lg:col-span-8 space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
                  Filtered Radar ({filteredDriverBookings.length} Loads within {radiusFilterKm} km)
                </h2>
                <div className="flex items-center gap-2">
                  {(passedBookingIds.length > 0 || skippedCoLoadIds.length > 0) && (
                    <button
                      onClick={() => {
                        setPassedBookingIds([]);
                        setSkippedCoLoadIds([]);
                      }}
                      className="text-xs bg-amber-500/20 border border-amber-500/40 text-amber-300 px-3 py-1.5 rounded-lg font-bold cursor-pointer"
                    >
                      ↺ Restore {passedBookingIds.length + skippedCoLoadIds.length} Passed/Skipped Load(s)
                    </button>
                  )}
                  <button
                    onClick={fetchLiveCloudData}
                    className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-slate-300 cursor-pointer"
                  >
                    Refresh Radar
                  </button>
                </div>
              </div>

              {filteredDriverBookings.map((b) => {
                const distFromDriver = calculateDistanceKm(driverBaseHub, b.pickup_hub);
                const upiUri = `upi://pay?pa=${driverNameInput.toLowerCase().replace(/\s+/g, '')}@ybl&pn=${encodeURIComponent(driverNameInput)}&am=${b.agreed_fare || b.offered_fare}&cu=INR`;
                const biltyCode = `NC-BLR-${String(b.id).slice(0, 6).toUpperCase()}`;
                const bookingBids = bidsByBooking[b.id] || [];
                const vLat = b.driver_lat || getHubCoords(b.pickup_hub).lat;
                const vLng = b.driver_lng || getHubCoords(b.pickup_hub).lng;

                const clubbedPoolOrders = b.pool_group_id
                  ? bookings.filter((other) => other.pool_group_id === b.pool_group_id)
                  : [b];
                const maxTruckKg = getFleetMaxWeight(b.vehicle_category);
                const totalPoolKg = clubbedPoolOrders.reduce((acc, item) => acc + Number(item.weight_kg || 0), 0);
                const remainingDeckKg = Math.max(0, maxTruckKg - totalPoolKg);
                const totalPoolPct = Math.min(100, Math.round((totalPoolKg / maxTruckKg) * 100));
                const totalPoolFare = clubbedPoolOrders.reduce((acc, item) => acc + Number(item.agreed_fare || item.offered_fare || 0), 0);

                const stackableCorridorLoads = bookings.filter(
                  (other) =>
                    other.id !== b.id &&
                    !skippedCoLoadIds.includes(other.id) &&
                    (!b.pool_group_id || other.pool_group_id !== b.pool_group_id) &&
                    other.status === 'broadcasting' &&
                    other.pickup_hub === b.pickup_hub &&
                    other.drop_hub === b.drop_hub &&
                    Number(other.weight_kg) <= remainingDeckKg
                );

                const matchingReturnLoads = bookings.filter(
                  (other) =>
                    other.id !== b.id &&
                    !passedBookingIds.includes(other.id) &&
                    other.status === 'broadcasting' &&
                    calculateDistanceKm(b.drop_hub, other.pickup_hub) <= 6
                );

                return (
                  <div key={b.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
                    <div className="flex flex-wrap justify-between items-center gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-black text-xs">
                          {b.vehicle_category}
                        </span>
                        <span className="font-bold text-white text-sm">{b.cargo_type} ({b.weight_kg} kg)</span>
                        {b.pool_group_id && (
                          <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded font-mono font-bold">
                            🔗 {b.pool_group_id} ({clubbedPoolOrders.length} Orders Clubbed)
                          </span>
                        )}
                        {b.has_insurance && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-bold">
                            🛡️ ₹2L Insured
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-amber-400 block">₹{b.agreed_fare || b.offered_fare}</span>
                        {clubbedPoolOrders.length > 1 && (
                          <span className="text-[11px] text-emerald-300 font-black block">
                            Total Pool Payout: ₹{totalPoolFare}
                          </span>
                        )}
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold">
                          📍 {distFromDriver} km from your stand
                        </span>
                      </div>
                    </div>

                    {/* DRIVER-SIDE MULTI-ORDER STACKING / CLUBBING ENGINE WITH UN-CLUB & SKIP */}
                    <div className="bg-slate-950 border border-cyan-500/40 rounded-xl p-3.5 space-y-2.5 text-xs">
                      <div className="flex flex-wrap justify-between items-center gap-2">
                        <span className="text-cyan-300 font-black flex items-center gap-1.5">
                          <Layers className="w-4 h-4" /> TRUCK DECK CAPACITY: {totalPoolKg} / {maxTruckKg} kg ({totalPoolPct}% Full)
                        </span>
                        <span className="text-emerald-300 font-bold">
                          {remainingDeckKg} kg ({100 - totalPoolPct}%) Free Space to Club Orders
                        </span>
                      </div>

                      <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden flex">
                        {clubbedPoolOrders.map((ord, idx) => {
                          const segPct = Math.max(5, Math.round((Number(ord.weight_kg) / maxTruckKg) * 100));
                          return (
                            <div
                              key={ord.id}
                              style={{ width: `${segPct}%` }}
                              className={`${segmentColors[idx % segmentColors.length]} h-full border-r border-slate-950 transition-all duration-500`}
                            />
                          );
                        })}
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {clubbedPoolOrders.map((ord, idx) => (
                          <div
                            key={ord.id}
                            className="text-[10px] bg-slate-900 border border-slate-800 px-2 py-1 rounded flex items-center gap-2 text-slate-200"
                          >
                            <span>
                              #{idx + 1} <b>{ord.customer_name}</b> ({ord.weight_kg}kg • ₹{ord.agreed_fare || ord.offered_fare})
                            </span>
                            {clubbedPoolOrders.length > 1 && b.status !== 'delivered' && (
                              <button
                                type="button"
                                onClick={() => handleRemoveOrderFromPool(ord)}
                                className="text-rose-400 hover:text-rose-300 font-black cursor-pointer"
                                title="Remove this order from your truck pool"
                              >
                                ✕ Remove
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {remainingDeckKg > 20 && (
                        <div className="pt-2 border-t border-slate-800 space-y-2">
                          {stackableCorridorLoads.length > 0 ? (
                            <div className="space-y-1.5">
                              <span className="text-[11px] text-amber-300 font-bold block">
                                📦 {stackableCorridorLoads.length} Compatible Corridor Load(s) Ready to Club Onto Your Truck:
                              </span>
                              {stackableCorridorLoads.map((coLoad) => (
                                <div
                                  key={coLoad.id}
                                  className="bg-slate-900 border border-cyan-500/30 p-2 rounded-lg flex flex-wrap justify-between items-center gap-2"
                                >
                                  <div>
                                    <div className="font-bold text-white">
                                      {coLoad.customer_name}: {coLoad.cargo_type}
                                    </div>
                                    <div className="text-[11px] text-slate-400">
                                      Weight: {coLoad.weight_kg} kg (+{Math.round((coLoad.weight_kg / maxTruckKg) * 100)}% Deck)
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-black text-emerald-400">+₹{coLoad.offered_fare}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleDriverClubOrderIntoPool(b, coLoad)}
                                      className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black px-3 py-1 rounded-lg cursor-pointer"
                                    >
                                      + Stack Onto My Truck
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setSkippedCoLoadIds((prev) => [...prev, coLoad.id])}
                                      className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold px-2.5 py-1 rounded-lg cursor-pointer"
                                    >
                                      ✕ Skip
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex flex-wrap justify-between items-center gap-2">
                              <span className="text-[11px] text-slate-400">
                                Have {remainingDeckKg} kg empty space left? Spawn a 2nd corridor order to test multi-order clubbing:
                              </span>
                              <button
                                type="button"
                                onClick={() => handleSimulateSecondPoolOrder(b)}
                                className="bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 border border-cyan-500/40 font-bold px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1 cursor-pointer transition"
                              >
                                <PlusCircle className="w-3.5 h-3.5" /> + Simulate 2nd Order to Club
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                        <div>
                          <span className="text-emerald-400 font-bold block">PICKUP</span>
                          <span className="text-white">{b.pickup_hub}</span>
                        </div>
                        <button
                          onClick={() => openGoogleMapsRoute(driverBaseHub, b.pickup_hub)}
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
                          onClick={() => openGoogleMapsRoute(b.pickup_hub, b.drop_hub)}
                          className="bg-slate-800 text-rose-400 p-2 rounded-lg font-bold cursor-pointer"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* DRIVER ACTIONS: ACCEPT, BID, OR PASS/DECLINE LOAD */}
                    {b.status === 'broadcasting' && (
                      <div className="space-y-3 pt-2 border-t border-slate-800">
                        <div className="flex flex-wrap justify-between items-center gap-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDriverDirectAccept(b)}
                              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs cursor-pointer"
                            >
                              ✅ Accept ₹{b.offered_fare} Instantly
                            </button>
                            <button
                              onClick={() => handleDriverPassLoad(b.id)}
                              className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold px-3.5 py-2.5 rounded-xl text-xs cursor-pointer flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Pass / Not Interested
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              placeholder="Propose Fare ₹"
                              value={bidInputs[b.id] || ''}
                              onChange={(e) => setBidInputs({ ...bidInputs, [b.id]: e.target.value })}
                              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white w-32"
                            />
                            <button
                              onClick={() => handleDriverPlaceBid(b.id)}
                              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-2 rounded-lg text-xs cursor-pointer"
                            >
                              Send Bid
                            </button>
                          </div>
                        </div>

                        {/* DRIVER NEGOTIATION THREAD WITH REJECT COUNTER & WITHDRAW BID OPTIONS */}
                        {bookingBids.length > 0 && (
                          <div className="bg-slate-950 border border-amber-500/30 rounded-xl p-3 space-y-2 text-xs">
                            <div className="text-amber-300 font-bold flex items-center gap-1">
                              <ArrowLeftRight className="w-3.5 h-3.5" /> Active Negotiation Thread with Lister:
                            </div>
                            {bookingBids.map((bid) => {
                              const isRejected = bid.status && bid.status !== 'active';
                              return (
                                <div
                                  key={bid.id}
                                  className={`bg-slate-900 border p-2.5 rounded-lg space-y-2 ${
                                    isRejected ? 'border-rose-500/30 opacity-75' : 'border-slate-800'
                                  }`}
                                >
                                  <div className="flex flex-wrap justify-between items-center gap-2">
                                    <span className="text-slate-300 flex items-center gap-2">
                                      Your Quote: <b className="text-amber-400">₹{bid.bid_amount}</b>
                                      {isRejected && (
                                        <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded text-[10px]">
                                          {bid.status.replaceAll('_', ' ').toUpperCase()}
                                        </span>
                                      )}
                                    </span>

                                    <div className="flex items-center gap-2">
                                      {bid.customer_counter ? (
                                        <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded font-bold">
                                          Lister Countered: ₹{bid.customer_counter}
                                        </span>
                                      ) : (
                                        <span className="text-slate-500 text-[11px]">Waiting for Lister response...</span>
                                      )}

                                      {!isRejected && (
                                        <button
                                          onClick={() => handleDriverWithdrawOrRejectBid(bid, false)}
                                          className="text-rose-400 hover:underline text-[11px] font-bold cursor-pointer"
                                        >
                                          ✕ Withdraw Bid
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {bid.customer_counter && !isRejected && (
                                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => handleLockAgreedBid(b, bid, bid.customer_counter)}
                                          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-3 py-1.5 rounded-lg cursor-pointer"
                                        >
                                          🤝 Accept ₹{bid.customer_counter}
                                        </button>
                                        <button
                                          onClick={() => handleDriverWithdrawOrRejectBid(bid, true)}
                                          className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                                        >
                                          ✕ Reject Counter
                                        </button>
                                      </div>

                                      <div className="flex items-center gap-1.5">
                                        <input
                                          type="number"
                                          placeholder="Re-Counter ₹"
                                          value={driverRecounterInputs[bid.id] || ''}
                                          onChange={(e) => setDriverRecounterInputs({ ...driverRecounterInputs, [bid.id]: e.target.value })}
                                          className="bg-slate-950 border border-amber-500/50 rounded-lg px-2.5 py-1 text-white w-28 text-xs"
                                        />
                                        <button
                                          onClick={() => handleDriverRecounterOffer(bid)}
                                          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2.5 py-1 rounded-lg cursor-pointer"
                                        >
                                          Re-Counter
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* DRIVER ACCEPTED VIEW WITH OPTION TO RELEASE / DECLINE BEFORE PICKUP OTP */}
                    {b.status === 'accepted' && (
                      <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-xl flex flex-wrap justify-between items-center gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <span>Enter 4-digit Pickup OTP from Shopkeeper:</span>
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

                        <button
                          onClick={() => handleReleaseAcceptedLoad(b, 'driver')}
                          className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold px-3 py-1 rounded-lg cursor-pointer flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          {b.pod_status === 'DIRECT_STAND_ASSIGNED' ? 'Decline Direct Dispatch' : 'Release Load'}
                        </button>
                      </div>
                    )}

                    {(b.status === 'accepted' || b.status === 'in_transit') && (
                      <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-3.5 space-y-2.5 text-xs">
                        <div className="flex flex-wrap justify-between items-center gap-2">
                          <span className="text-amber-300 font-black flex items-center gap-1.5">
                            <Repeat className="w-4 h-4 text-amber-400" /> RETURN LOAD RADAR AT {b.drop_hub.toUpperCase()}
                          </span>
                          <span className="text-[10px] bg-amber-500/20 text-amber-200 px-2 py-0.5 rounded font-bold">
                            Zero Empty Return Miles
                          </span>
                        </div>

                        {matchingReturnLoads.length > 0 ? (
                          <div className="space-y-2">
                            {matchingReturnLoads.map((retLoad) => (
                              <div
                                key={retLoad.id}
                                className="bg-slate-950 border border-amber-500/30 p-2.5 rounded-lg flex flex-wrap justify-between items-center gap-2"
                              >
                                <div>
                                  <div className="font-bold text-white">
                                    {retLoad.pickup_hub} → {retLoad.drop_hub}
                                  </div>
                                  <div className="text-slate-400 text-[11px]">
                                    {retLoad.cargo_type} ({retLoad.weight_kg} kg)
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-amber-400 text-sm">+₹{retLoad.offered_fare}</span>
                                  <button
                                    onClick={() => handleDriverDirectAccept(retLoad)}
                                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3 py-1.5 rounded-lg cursor-pointer"
                                  >
                                    Lock Return Load
                                  </button>
                                  <button
                                    onClick={() => handleDriverPassLoad(retLoad.id)}
                                    className="bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold px-2.5 py-1.5 rounded-lg cursor-pointer"
                                  >
                                    ✕ Pass
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-wrap justify-between items-center gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                            <span className="text-slate-400 text-[11px]">
                              No open return load at {b.drop_hub} right now. Want to test backhaul matching?
                            </span>
                            <button
                              onClick={() => handleCreateSampleReturnLoad(b.drop_hub, b.pickup_hub)}
                              className="bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-300 border border-amber-500/40 font-bold px-2.5 py-1 rounded-lg text-[11px] transition cursor-pointer"
                            >
                              + Simulate Return Load ({b.drop_hub.split('/')[0].trim()} → {b.pickup_hub.split('/')[0].trim()})
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {b.status === 'in_transit' && (
                      <div className="bg-purple-500/10 border border-purple-500/30 p-4 rounded-xl space-y-3 text-xs">
                        <div className="flex flex-wrap justify-between items-center gap-2">
                          <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                            <LocateFixed className="w-4 h-4 animate-pulse" /> AUTO-GPS STREAMING TO LISTER ({vLat}° N, {vLng}° E)
                          </span>
                          <button
                            onClick={() => openGoogleMapsRoute(b.pickup_hub, b.drop_hub)}
                            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1"
                          >
                            <Navigation className="w-3.5 h-3.5" /> Open Turn-by-Turn Route Map
                          </button>
                        </div>

                        <div className="rounded-xl overflow-hidden border border-slate-800 h-40 w-full bg-slate-900">
                          <iframe
                            title={`driver-map-${b.id}`}
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            loading="lazy"
                            src={`https://maps.google.com/maps?q=${encodeURIComponent(b.drop_hub + ', Bengaluru')}&z=12&output=embed`}
                          />
                        </div>

                        <div className="flex flex-wrap justify-between items-center gap-3 pt-2 border-t border-purple-500/20">
                          <span className="text-purple-200 font-semibold">Arrived at {b.drop_hub}?</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Receiver Name (POD Sign-Off)"
                              value={receiverInputs[b.id] || ''}
                              onChange={(e) => setReceiverInputs({ ...receiverInputs, [b.id]: e.target.value })}
                              className="bg-slate-950 border border-purple-400/50 rounded-lg px-3 py-1.5 text-white text-xs w-48"
                            />
                            <button
                              onClick={() => handleDeliver(b)}
                              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-1.5 rounded-lg cursor-pointer"
                            >
                              Generate POD & Bilty
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {b.status === 'delivered' && (
                      <div className="bg-emerald-500/10 border border-emerald-500/40 p-4 rounded-xl flex justify-between items-center gap-3">
                        <div className="text-xs space-y-1">
                          <span className="text-emerald-400 font-black flex items-center gap-1 text-sm">
                            <FileCheck className="w-4 h-4" /> BILTY ISSUED: {biltyCode}
                          </span>
                          <p className="text-slate-200">
                            POD: <span className="font-mono text-emerald-300">{b.pod_status || 'VERIFIED_POD'}</span>
                          </p>
                          {b.has_insurance && (
                            <p className="text-amber-300 font-bold">
                              🛡️ Transit Insurance Verified (₹2,00,000 Cover)
                            </p>
                          )}
                          <p className="text-slate-400 text-[11px] font-mono">
                            Timestamp: {new Date(b.delivered_at || Date.now()).toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-white p-2 rounded-xl text-center shrink-0">
                          <QRCodeSVG value={upiUri} size={72} />
                          <span className="text-[9px] text-slate-950 font-black block mt-1">Scan to Pay ₹{b.agreed_fare || b.offered_fare}</span>
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