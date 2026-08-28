'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ConvoyGroup, GroupMember, Checkpoint, ConvoyMessage } from '@/lib/types';
import CheckpointModal from '@/components/CheckpointModal';
import {
  Bike,
  Car,
  Flag,
  Share2,
  Copy,
  Check,
  MessageSquare,
  Users,
  Crosshair,
  Gauge,
  Battery,
  BatteryCharging,
  Ruler,
  Compass,
  ArrowLeft,
  Sparkles,
  Radio,
  Play,
  StopCircle,
  MapPin,
  Clock,
  ShieldAlert,
  Lock,
  LogOut,
  AlertTriangle,
  Leaf,
  Zap,
  UserX,
  Shield,
  Eye,
  Edit3,
  Crown,
  Sparkle,
  Send,
  X,
  Flame,
  AlertCircle
} from 'lucide-react';

const MultiplayerConvoyMap = dynamic(() => import('@/components/MultiplayerConvoyMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[520px] bg-[#020604] rounded-3xl flex flex-col items-center justify-center text-emerald-600 border border-emerald-900/60 font-mono">
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
      <span className="text-xs font-semibold tracking-wider">MENGHUBUNGKAN SATELIT GPS ECO-SYNC...</span>
    </div>
  ),
});

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function ConvoyRoomPage() {
  const params = useParams();
  const router = useRouter();
  const rawCode = params?.code as string;
  const groupCode = rawCode?.toUpperCase();

  const [group, setGroup] = useState<ConvoyGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Vehicle Routing Mode: Motor vs Mobil
  const [vehicleMode, setVehicleMode] = useState<'motor' | 'mobil'>('motor');

  // My Member Identity in this room
  const [myMemberId, setMyMemberId] = useState<string | null>(null);
  const [focusedMemberId, setFocusedMemberId] = useState<string | undefined>(undefined);

  // Join form state (Motor vs Mobil)
  const [joinName, setJoinName] = useState('');
  const [joinVehicleType, setJoinVehicleType] = useState<'Motor' | 'Mobil'>('Motor');
  const [joinVehicleDetail, setJoinVehicleDetail] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);

  // Checkpoint Modal
  const [isCheckpointModalOpen, setIsCheckpointModalOpen] = useState(false);

  // Edit Vehicle Modal
  const [isEditVehicleOpen, setIsEditVehicleOpen] = useState(false);
  const [editVehicleType, setEditVehicleType] = useState<'Motor' | 'Mobil'>('Motor');
  const [editVehicleDetail, setEditVehicleDetail] = useState('');
  const [editVehicleLoading, setEditVehicleLoading] = useState(false);

  // Transfer Captain Modal
  const [memberToMakeCaptain, setMemberToMakeCaptain] = useState<GroupMember | null>(null);
  const [transferCaptainLoading, setTransferCaptainLoading] = useState(false);

  // Leave / Disband Group Modal
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const isVoluntaryLeavingRef = useRef(false);

  // Kick Member Modal
  const [memberToKick, setMemberToKick] = useState<GroupMember | null>(null);
  const [kickLoading, setKickLoading] = useState(false);

  // Live Convoy Group Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ConvoyMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const lastSeenMsgCountRef = useRef(0);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  // Share link state
  const [copied, setCopied] = useState(false);

  // Battery State
  const [batteryPct, setBatteryPct] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState(false);

  const watchIdRef = useRef<number | null>(null);

  // Load member ID from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && groupCode) {
      const saved = localStorage.getItem(`ridesync_member_${groupCode}`);
      if (saved) {
        setMyMemberId(saved);
        if (!focusedMemberId) setFocusedMemberId(saved);
      }
    }
  }, [groupCode, focusedMemberId]);

  // Read Battery
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any).getBattery().then((b: any) => {
        setBatteryPct(Math.round(b.level * 100));
        setIsCharging(b.charging);
        b.addEventListener('levelchange', () => setBatteryPct(Math.round(b.level * 100)));
        b.addEventListener('chargingchange', () => setIsCharging(b.charging));
      }).catch(() => {});
    }
  }, []);

  // Fetch Group Data & Auto-Recovery Engine
  useEffect(() => {
    if (!groupCode) return;

    async function fetchGroup() {
      if (isVoluntaryLeavingRef.current) return;

      try {
        const res = await fetch(`/api/groups/${groupCode}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setGroup(data);
          setError(null);
          if (typeof window !== 'undefined') {
            localStorage.setItem(`ridesync_group_cache_${groupCode}`, JSON.stringify(data));
          }

          // Cek apakah akun saya telah dikeluarkan oleh Captain
          if (myMemberId && data.members && !data.members.some((m: any) => m.id === myMemberId)) {
            if (!isVoluntaryLeavingRef.current) {
              localStorage.removeItem(`ridesync_member_${groupCode}`);
              setMyMemberId(null);
              alert('Anda telah dikeluarkan dari grup konvoi oleh Road Captain.');
              router.push('/');
            }
          }
        } else {
          if (!isVoluntaryLeavingRef.current) {
            if (typeof window !== 'undefined') {
              localStorage.removeItem(`ridesync_group_cache_${groupCode}`);
              localStorage.removeItem(`ridesync_member_${groupCode}`);
            }
            setError('Grup konvoi tidak ditemukan atau telah dibubarkan oleh Road Captain.');
          }
        }
      } catch (e) {
        if (!isVoluntaryLeavingRef.current) {
          setError('Gagal memuat grup konvoi.');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchGroup();
    const interval = setInterval(fetchGroup, 2000);
    return () => clearInterval(interval);
  }, [groupCode, myMemberId, router]);

function playConvoyAlertSound(isUrgent?: boolean) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      if (isUrgent) {
        navigator.vibrate([250, 100, 250, 100, 500]);
      } else {
        navigator.vibrate(100);
      }
    }

    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (isUrgent) {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(440, ctx.currentTime + 0.15);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch (e) {}
}

  // Fetch Live Chat Messages continuously
  useEffect(() => {
    if (!groupCode) return;

    async function fetchMessages() {
      try {
        const res = await fetch(`/api/groups/${groupCode}/messages`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const msgs: ConvoyMessage[] = data.messages || [];
          
          // Deteksi pesan baru masuk untuk sound alert
          if (msgs.length > lastSeenMsgCountRef.current && lastSeenMsgCountRef.current > 0) {
            const latest = msgs[msgs.length - 1];
            if (latest && latest.sender_id !== myMemberId) {
              playConvoyAlertSound(latest.is_urgent);
            }
          }

          setMessages(msgs);

          if (!isChatOpen) {
            const diff = msgs.length - lastSeenMsgCountRef.current;
            if (diff > 0) setUnreadChatCount(diff);
          } else {
            lastSeenMsgCountRef.current = msgs.length;
            setUnreadChatCount(0);
          }
        }
      } catch (e) {}
    }

    fetchMessages();
    const chatInterval = setInterval(fetchMessages, 2000);
    return () => clearInterval(chatInterval);
  }, [groupCode, isChatOpen, myMemberId]);

  // Auto scroll chat to bottom when open
  useEffect(() => {
    if (isChatOpen) {
      lastSeenMsgCountRef.current = messages.length;
      setUnreadChatCount(0);
      setTimeout(() => {
        chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [isChatOpen, messages.length]);

  // Broadcast My GPS Location continuously
  useEffect(() => {
    if (!myMemberId || !groupCode || typeof navigator === 'undefined' || !navigator.geolocation) return;

    const onLocationSuccess = async (pos: GeolocationPosition) => {
      if (isVoluntaryLeavingRef.current) return;

      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const speed = pos.coords.speed ? pos.coords.speed * 3.6 : 0;
      const accuracy = pos.coords.accuracy;

      let address = '';
      try {
        const geoRes = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
        if (geoRes.ok) {
          const d = await geoRes.json();
          address = d.address || '';
        }
      } catch (e) {}

      try {
        await fetch(`/api/groups/${groupCode}/location`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memberId: myMemberId,
            latitude: lat,
            longitude: lng,
            accuracy,
            speed,
            battery_level: batteryPct ?? undefined,
            is_charging: isCharging,
            address: address || undefined,
            is_active: true
          })
        });
      } catch (e) {}
    };

    navigator.geolocation.getCurrentPosition(onLocationSuccess, () => {
      navigator.geolocation.getCurrentPosition(onLocationSuccess, () => {}, {
        enableHighAccuracy: false,
        timeout: 20000
      });
    }, {
      enableHighAccuracy: true,
      timeout: 10000
    });

    const watchId = navigator.geolocation.watchPosition(onLocationSuccess, (err) => console.warn(err), {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 5000
    });

    watchIdRef.current = watchId;

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [myMemberId, groupCode, batteryPct, isCharging]);

  // Handle Join Form with Real Position
  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinName) return;

    setJoinLoading(true);

    const fullVehicle = joinVehicleDetail.trim()
      ? `${joinVehicleType} (${joinVehicleDetail.trim()})`
      : joinVehicleType;

    const doJoin = async (lat?: number, lng?: number) => {
      try {
        const res = await fetch(`/api/groups/${groupCode}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: joinName,
            motorcycleModel: fullVehicle,
            role: 'Rider',
            latitude: lat,
            longitude: lng
          })
        });

        if (res.ok) {
          const data = await res.json();
          setMyMemberId(data.memberId);
          setFocusedMemberId(data.memberId);
          localStorage.setItem(`ridesync_member_${groupCode}`, data.memberId);
          if (data.group) {
            setGroup(data.group);
            localStorage.setItem(`ridesync_group_cache_${groupCode}`, JSON.stringify(data.group));
          }
        } else {
          alert('Gagal bergabung ke grup konvoi.');
        }
      } catch (e) {
        alert('Terjadi kesalahan jaringan.');
      } finally {
        setJoinLoading(false);
      }
    };

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          doJoin(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          doJoin();
        },
        { enableHighAccuracy: false, timeout: 5000 }
      );
    } else {
      doJoin();
    }
  };

  const myMember = group?.members.find((m) => m.id === myMemberId);
  const isCaptain = myMember?.role === 'Road Captain' || group?.created_by === myMember?.name;

  // Handle Leave Group / Disband Group (Jika Road Captain keluar -> grup bubar)
  const handleConfirmLeave = async () => {
    isVoluntaryLeavingRef.current = true;
    setLeaveLoading(true);
    try {
      if (myMemberId && groupCode) {
        if (watchIdRef.current !== null && typeof navigator !== 'undefined') {
          navigator.geolocation.clearWatch(watchIdRef.current);
        }

        if (isCaptain) {
          await fetch(`/api/groups/${groupCode}/disband`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memberId: myMemberId })
          });
        } else {
          await fetch(`/api/groups/${groupCode}/leave`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memberId: myMemberId })
          });
        }

        localStorage.removeItem(`ridesync_member_${groupCode}`);
        localStorage.removeItem(`ridesync_group_cache_${groupCode}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLeaveLoading(false);
      setIsLeaveModalOpen(false);
      router.push('/');
    }
  };

  // Handle Update My Vehicle
  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myMemberId) return;

    const fullVehicle = editVehicleDetail.trim()
      ? `${editVehicleType} (${editVehicleDetail.trim()})`
      : editVehicleType;

    setEditVehicleLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupCode}/vehicle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: myMemberId,
          vehicleModel: fullVehicle
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.group) {
          setGroup(data.group);
          localStorage.setItem(`ridesync_group_cache_${groupCode}`, JSON.stringify(data.group));
        }
        setIsEditVehicleOpen(false);
      } else {
        alert('Gagal memperbarui info kendaraan.');
      }
    } catch (e) {
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setEditVehicleLoading(false);
    }
  };

  // Handle Transfer Road Captain
  const handleConfirmTransferCaptain = async () => {
    if (!memberToMakeCaptain || !myMemberId) return;

    setTransferCaptainLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupCode}/transfer-captain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterMemberId: myMemberId,
          newCaptainMemberId: memberToMakeCaptain.id
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.group) {
          setGroup(data.group);
          localStorage.setItem(`ridesync_group_cache_${groupCode}`, JSON.stringify(data.group));
        }
        setMemberToMakeCaptain(null);
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal memindahkan jabatan Road Captain.');
      }
    } catch (e) {
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setTransferCaptainLoading(false);
    }
  };

  // Handle Kick Rider by Road Captain
  const handleConfirmKick = async () => {
    if (!memberToKick || !myMemberId) return;

    setKickLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupCode}/kick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterMemberId: myMemberId,
          targetMemberId: memberToKick.id
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.group) {
          setGroup(data.group);
          localStorage.setItem(`ridesync_group_cache_${groupCode}`, JSON.stringify(data.group));
        }
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal mengeluarkan rider.');
      }
    } catch (e) {
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setKickLoading(false);
      setMemberToKick(null);
    }
  };

  // Handle Send Chat Message
  const handleSendMessage = async (customText?: string, isUrgentFlag?: boolean) => {
    const textToSend = customText || inputMessage;
    if (!myMember || !textToSend.trim()) return;

    setSendLoading(true);
    try {
      const vehicleName = myMember.motorcycle_model?.startsWith('Mobil') ? 'Mobil' : 'Motor';
      const res = await fetch(`/api/groups/${groupCode}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: myMember.id,
          senderName: myMember.name,
          vehicleType: vehicleName,
          message: textToSend.trim(),
          isUrgent: !!isUrgentFlag
        })
      });

      if (res.ok) {
        if (!customText) setInputMessage('');
        const data = await res.json();
        if (data.message) {
          setMessages((prev) => [...prev, data.message]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSendLoading(false);
    }
  };

  // Generate Direct Public URL (Without Vercel Auth requirement)
  const getPublicShareUrl = () => {
    if (typeof window === 'undefined') return '';
    if (window.location.hostname === 'localhost') {
      return `${window.location.origin}/room/${groupCode}`;
    }
    return `https://ridesync-web.vercel.app/room/${groupCode}`;
  };

  const handleCopyGroupLink = () => {
    const url = getPublicShareUrl();
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const url = getPublicShareUrl();
    const text = encodeURIComponent(
      `🏍️ Yuk gabung ke Konvoi "${group?.name || 'Touring'}" di RideSync!\nBuka link ini untuk pantau & berbagi posisi motor real-time (Langsung tanpa login):\n${url}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleSaveCheckpoint = async (cp: Checkpoint) => {
    if (!isCaptain) {
      alert('Hanya Road Captain / Pembuat Grup yang berhak mengatur titik tujuan.');
      return;
    }

    try {
      const res = await fetch(`/api/groups/${groupCode}/checkpoint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...cp, memberId: myMemberId })
      });
      if (res.ok) {
        const data = await res.json();
        if (group) {
          const updated = { ...group, checkpoint: data.checkpoint };
          setGroup(updated);
          localStorage.setItem(`ridesync_group_cache_${groupCode}`, JSON.stringify(updated));
        }
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal mengubah titik tujuan.');
      }
    } catch (e) {}
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030705] flex flex-col items-center justify-center p-4 text-center font-mono">
        <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-emerald-400 text-xs font-bold tracking-widest uppercase">MEMUAT ROOM KONVOI {groupCode}...</p>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-[#030705] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#050d09] border border-emerald-900/80 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mx-auto border border-red-500/20">
            <Users className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-white">Grup Konvoi Selesai</h2>
          <p className="text-xs text-emerald-400/60 leading-relaxed">
            {error || `Grup konvoi ${groupCode} telah selesai atau Anda telah keluar.`}
          </p>
          <button
            onClick={() => router.push('/')}
            className="py-2.5 px-4 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-800 rounded-2xl text-xs font-bold transition inline-flex items-center gap-2 cursor-pointer font-mono"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </button>
        </div>
      </div>
    );
  }

  // ==============================================================================
  // JIKA PENGGUNA BELUM BERGABUNG KE GRUP (JOIN GATE SCREEN)
  // ==============================================================================
  if (!myMemberId) {
    return (
      <div className="min-h-screen bg-[#030705] flex flex-col items-center justify-center p-4 selection:bg-emerald-400 selection:text-black relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md bg-[#050d09]/95 border border-emerald-900/80 rounded-3xl p-7 shadow-[0_10px_40px_rgba(0,0,0,0.9)] backdrop-blur-2xl relative z-10 space-y-5">
          {/* Header Undangan Grup */}
          <div className="text-center space-y-1.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-400 via-teal-500 to-cyan-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] mx-auto p-[2px]">
              <div className="w-full h-full bg-[#040d09] rounded-[14px] flex items-center justify-center">
                <Bike className="w-7 h-7 text-emerald-400" />
              </div>
            </div>
            <span className="text-[10px] px-2.5 py-0.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-full font-bold uppercase tracking-wider font-mono">
              Undangan Konvoi Motor & Mobil
            </span>
            <h1 className="text-xl font-black text-white">{group.name}</h1>
            <p className="text-xs text-emerald-400/60 font-mono">
              Kode Room: <b className="text-emerald-300 font-bold">{group.code}</b> • Captain: <b className="text-white">{group.created_by}</b>
            </p>
          </div>

          {/* Info Checkpoint Tujuan */}
          {group.checkpoint && (
            <div className="bg-emerald-950/40 border border-emerald-500/30 p-3.5 rounded-2xl flex items-center gap-3 text-xs text-emerald-200">
              <Flag className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-emerald-400/80 block uppercase font-bold font-mono">Titik Tujuan Konvoi</span>
                <span className="font-bold text-white truncate block">{group.checkpoint.name}</span>
              </div>
            </div>
          )}

          {/* Form Gabung Ringkas & Praktis */}
          <form onSubmit={handleJoinSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-emerald-200 font-semibold mb-1">
                Nama Anda / Panggilan <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Dani / Budi"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                className="w-full bg-[#020704] border border-emerald-900 focus:border-emerald-400 rounded-2xl py-2.5 px-3.5 text-sm text-white placeholder:text-emerald-900 focus:outline-none transition font-sans"
              />
            </div>

            {/* Pilihan Jenis Kendaraan: Motor vs Mobil */}
            <div>
              <label className="block text-emerald-200 font-semibold mb-1 font-mono">Jenis Kendaraan Anda</label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setJoinVehicleType('Motor')}
                  className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition cursor-pointer ${
                    joinVehicleType === 'Motor'
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                      : 'bg-[#020704] border-emerald-900 text-emerald-400/60'
                  }`}
                >
                  <Bike className="w-4 h-4" />
                  <span>🏍️ Motor</span>
                </button>
                <button
                  type="button"
                  onClick={() => setJoinVehicleType('Mobil')}
                  className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition cursor-pointer ${
                    joinVehicleType === 'Mobil'
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                      : 'bg-[#020704] border-emerald-900 text-emerald-400/60'
                  }`}
                >
                  <Car className="w-4 h-4" />
                  <span>🚗 Mobil</span>
                </button>
              </div>
              <input
                type="text"
                placeholder="Detail tipe (opsional, misal: ZX25R / NMAX / Avanza)"
                value={joinVehicleDetail}
                onChange={(e) => setJoinVehicleDetail(e.target.value)}
                className="w-full bg-[#020704] border border-emerald-900/80 focus:border-emerald-400 rounded-2xl py-2 px-3 text-xs text-white placeholder:text-emerald-900 focus:outline-none transition font-sans"
              />
            </div>

            <button
              type="submit"
              disabled={joinLoading || !joinName}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-black font-black rounded-2xl text-sm shadow-[0_0_25px_rgba(16,185,129,0.35)] transition flex items-center justify-center gap-2 transform active:scale-95 cursor-pointer disabled:opacity-50 mt-1"
            >
              {joinLoading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Gabung ke Peta Konvoi & Aktifkan GPS</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==============================================================================
  // MULTIPLAYER CONVOY ROOM DASHBOARD
  // ==============================================================================
  return (
    <div className="min-h-screen bg-[#030705] flex flex-col font-sans text-emerald-50 selection:bg-emerald-400 selection:text-black">
      {/* Top Navbar Header - Fully Sticky with z-[1000] (Strictly Above Map) */}
      <header className="sticky top-0 z-[1000] w-full border-b border-emerald-950/80 bg-[#040806]/98 backdrop-blur-2xl shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setIsLeaveModalOpen(true)}
              title={isCaptain ? 'Bubarkan & Keluar Konvoi' : 'Keluar dari Konvoi'}
              className="flex items-center gap-1.5 py-1.5 px-2.5 sm:px-3 bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-300 hover:text-white rounded-xl text-xs font-bold transition shadow font-mono cursor-pointer shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isCaptain ? 'Bubarkan Grup' : 'Keluar Grup'}</span>
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-sm sm:text-base font-black text-white tracking-tight truncate">{group.name}</h1>
                <span className="text-[9px] sm:text-[10px] px-2 py-0.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-full font-mono font-bold shrink-0">
                  {group.code}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-emerald-400/60 font-mono truncate">
                {group.members.length} Rider • Anda: <b className="text-emerald-300">{myMember?.name}</b> {isCaptain && <span className="text-teal-300 font-bold">(Captain)</span>}
              </p>
            </div>
          </div>

          {/* Action Buttons: Chat, Checkpoint, Share */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Tombol Live Convoy Chat di Topbar */}
            <button
              onClick={() => setIsChatOpen(true)}
              title="Obrolan Rombongan Konvoi"
              className="relative flex items-center gap-1.5 py-1.5 px-3 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold transition shadow-[0_0_15px_rgba(16,185,129,0.15)] cursor-pointer font-mono"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Obrolan</span>
              {unreadChatCount > 0 && (
                <span className="relative flex h-2.5 w-2.5 ml-0.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-white"></span>
                </span>
              )}
            </button>

            {isCaptain && (
              <button
                onClick={() => setIsCheckpointModalOpen(true)}
                title="Atur Titik Tujuan Konvoi (Hanya Road Captain)"
                className="flex items-center gap-1.5 py-1.5 px-2.5 sm:px-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold transition shadow-[0_0_15px_rgba(16,185,129,0.2)] cursor-pointer"
              >
                <Flag className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Set Tujuan</span>
              </button>
            )}

            <button
              onClick={handleCopyGroupLink}
              className="hidden sm:flex items-center gap-1.5 py-1.5 px-3 bg-[#06100c] hover:bg-emerald-950 border border-emerald-900 text-emerald-200 rounded-xl text-xs font-bold transition shadow font-mono cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin!' : 'Salin'}</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 py-1.5 px-2.5 sm:px-3.5 bg-emerald-600 hover:bg-emerald-500 text-black font-extrabold rounded-xl text-xs transition shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share WA</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Convoy Members Roster (5 cols) */}
        <section className="lg:col-span-5 flex flex-col gap-4">
          {/* Active Checkpoint Banner */}
          {group.checkpoint && (
            <div className="bg-[#050d09]/95 border border-emerald-500/30 p-4 rounded-3xl flex items-center justify-between gap-3 shadow-[0_0_25px_rgba(16,185,129,0.1)]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <Flag className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider font-mono">Titik Tujuan Bersama</span>
                    {isCaptain && (
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-bold font-mono">
                        Bisa Diedit
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-black text-white truncate">{group.checkpoint.name}</h3>
                  <p className="text-[11px] text-emerald-400/60 truncate">{group.checkpoint.description || 'Titik Kumpul / Rest Area'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Convoy Members List */}
          <div className="bg-[#050d09]/90 border border-emerald-900/70 rounded-3xl p-5 shadow-2xl backdrop-blur-xl flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Radio className="w-4 h-4 text-emerald-400" />
                <span>Rombongan Konvoi ({group.members.length} Rider)</span>
              </div>
              <span className="text-[10px] text-emerald-500 font-mono">Klik untuk Pantau</span>
            </div>

            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {group.members.map((member) => {
                const isMe = member.id === myMemberId;
                const isFocused = member.id === focusedMemberId;
                const memberIsCaptain = member.role === 'Road Captain' || group.created_by === member.name;
                const isCar = (member.motorcycle_model || '').toLowerCase().includes('mobil');
                const distanceToCp = group.checkpoint
                  ? calculateDistance(member.latitude, member.longitude, group.checkpoint.latitude, group.checkpoint.longitude)
                  : null;

                return (
                  <div
                    key={member.id}
                    onClick={() => setFocusedMemberId(member.id)}
                    className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 cursor-pointer ${
                      isFocused
                        ? 'bg-emerald-950/60 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.25)] ring-1 ring-emerald-400/50'
                        : isMe
                        ? 'bg-emerald-950/30 border-emerald-600/50 hover:border-emerald-400'
                        : 'bg-[#020704]/80 border-emerald-950 hover:border-emerald-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 flex items-center justify-center font-bold text-white text-xs uppercase overflow-hidden shrink-0">
                        {member.avatar_url ? (
                          <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : isCar ? (
                          <Car className={`w-5 h-5 ${isFocused ? 'text-white' : 'text-cyan-400'}`} />
                        ) : (
                          <Bike className={`w-5 h-5 ${isFocused ? 'text-white' : isMe ? 'text-emerald-400' : 'text-teal-400'}`} />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white truncate">
                            {member.name} {isMe && <span className="text-emerald-400">(Anda)</span>}
                          </h4>
                          {memberIsCaptain && (
                            <span className="text-[10px] px-2 py-0.5 bg-gradient-to-r from-amber-400/20 to-emerald-400/20 border border-amber-400/50 text-amber-300 rounded-full font-extrabold font-mono flex items-center gap-1">
                              <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />
                              <span>Captain</span>
                            </span>
                          )}
                        </div>

                        {/* Info Kendaraan: Motor vs Mobil */}
                        <div className="flex items-center gap-2 text-[11px] text-emerald-300/80 truncate mt-0.5">
                          <span className="font-semibold">{member.motorcycle_model || 'Motor'}</span>
                          {isMe && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const isCarType = (member.motorcycle_model || '').startsWith('Mobil');
                                setEditVehicleType(isCarType ? 'Mobil' : 'Motor');
                                setIsEditVehicleOpen(true);
                              }}
                              title="Ubah info kendaraan Anda"
                              className="text-[10px] text-emerald-400 hover:text-white px-1.5 py-0.2 bg-emerald-950/80 border border-emerald-700/50 rounded-md inline-flex items-center gap-1 font-mono cursor-pointer"
                            >
                              <Edit3 className="w-2.5 h-2.5" />
                              <span>Ubah</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1.5 text-xs font-mono font-bold text-white">
                          <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{member.speed ? Math.round(member.speed) : 0} km/h</span>
                        </div>
                        {distanceToCp !== null && (
                          <span className="text-[10px] text-teal-400 block font-mono mt-0.5">
                            Ke Tujuan: {distanceToCp < 1 ? `${Math.round(distanceToCp * 1000)}m` : `${distanceToCp.toFixed(1)}km`}
                          </span>
                        )}
                      </div>

                      {/* Tombol Pindah Captain & Kick (Khusus Road Captain) */}
                      {isCaptain && !isMe && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMemberToMakeCaptain(member);
                            }}
                            title={`Jadikan ${member.name} sebagai Road Captain baru`}
                            className="p-1.5 rounded-xl bg-amber-950/40 hover:bg-amber-900 border border-amber-800/60 text-amber-400 hover:text-white transition cursor-pointer"
                          >
                            <Crown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMemberToKick(member);
                            }}
                            title={`Keluarkan ${member.name} dari konvoi`}
                            className="p-1.5 rounded-xl bg-red-950/40 hover:bg-red-900 border border-red-800/60 text-red-400 hover:text-white transition cursor-pointer"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Right Column: Multiplayer Map (7 cols) */}
        <section className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex-1 h-full min-h-[500px] lg:min-h-[660px]">
            <MultiplayerConvoyMap
              members={group.members}
              currentMemberId={myMemberId}
              focusedMemberId={focusedMemberId}
              onSelectMember={setFocusedMemberId}
              checkpoint={group.checkpoint}
              vehicleMode={vehicleMode}
              onToggleVehicleMode={setVehicleMode}
            />
          </div>
        </section>
      </main>

      {/* Checkpoint Modal (Hanya jika Captain) */}
      {isCaptain && (
        <CheckpointModal
          isOpen={isCheckpointModalOpen}
          onClose={() => setIsCheckpointModalOpen(false)}
          currentCheckpoint={group.checkpoint}
          onSave={handleSaveCheckpoint}
          userCurrentLocation={myMember ? { latitude: myMember.latitude, longitude: myMember.longitude } : undefined}
        />
      )}

      {/* Modal Live Convoy Group Chat (z-[9999]) */}
      {isChatOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in">
          <div className="max-w-md w-full bg-[#050d09] border border-emerald-500/40 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col h-[600px] max-h-[90vh] overflow-hidden">
            {/* Chat Header */}
            <div className="p-4 border-b border-emerald-950 bg-[#030906] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Obrolan Konvoi Live</h3>
                  <p className="text-[10px] text-emerald-400/70 font-mono">
                    {group.name} • {group.members.length} Rider
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-1.5 text-emerald-400/60 hover:text-white rounded-xl hover:bg-emerald-950 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans text-xs">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-emerald-400/50 space-y-2 font-mono">
                  <MessageSquare className="w-8 h-8 opacity-40" />
                  <p>Belum ada obrolan konvoi.</p>
                  <p className="text-[10px]">Gunakan tombol preset di atas atau ketik pesan untuk broadcast ke semua rider.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender_id === myMemberId;
                  const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-emerald-400/70 font-mono">
                        <span>{msg.vehicle_type === 'Mobil' ? '🚗' : '🏍️'}</span>
                        <span className="font-bold text-emerald-300">{isMine ? 'Anda' : msg.sender_name}</span>
                        <span>•</span>
                        <span>{time}</span>
                      </div>
                      <div
                        className={`max-w-[82%] p-3 rounded-2xl ${
                          msg.is_urgent
                            ? 'bg-red-950/90 border border-red-500 text-red-100 font-bold shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse'
                            : isMine
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-black font-semibold shadow-md rounded-tr-sm'
                            : 'bg-[#020704] border border-emerald-900/80 text-emerald-100 rounded-tl-sm'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatMessagesEndRef} />
            </div>

            {/* Chat Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 border-t border-emerald-950 bg-[#030906] flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ketik pesan ke seluruh rombongan..."
                className="flex-1 bg-[#020704] border border-emerald-900 focus:border-emerald-400 rounded-2xl py-2 px-3.5 text-xs text-white placeholder:text-emerald-900 focus:outline-none transition"
              />
              <button
                type="submit"
                disabled={sendLoading || !inputMessage.trim()}
                className="p-2.5 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-black rounded-2xl transition disabled:opacity-40 cursor-pointer"
              >
                <Send className="w-4 h-4 fill-current" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ubah Informasi Kendaraan (Motor vs Mobil) */}
      {isEditVehicleOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in">
          <div className="max-w-sm w-full bg-[#050d09] border border-emerald-900/80 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
              <Bike className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-white">Pilih Jenis Kendaraan</h3>
              <p className="text-xs text-emerald-300/60 leading-relaxed">
                Rider lain akan mengetahui jenis kendaraan yang Anda kendarai di konvoi.
              </p>
            </div>

            <form onSubmit={handleSaveVehicle} className="space-y-3 pt-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEditVehicleType('Motor')}
                  className={`py-2.5 px-3 rounded-2xl border flex items-center justify-center gap-1.5 font-bold transition cursor-pointer ${
                    editVehicleType === 'Motor'
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                      : 'bg-[#020704] border-emerald-900 text-emerald-400/60'
                  }`}
                >
                  <Bike className="w-4 h-4" />
                  <span>🏍️ Motor</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditVehicleType('Mobil')}
                  className={`py-2.5 px-3 rounded-2xl border flex items-center justify-center gap-1.5 font-bold transition cursor-pointer ${
                    editVehicleType === 'Mobil'
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                      : 'bg-[#020704] border-emerald-900 text-emerald-400/60'
                  }`}
                >
                  <Car className="w-4 h-4" />
                  <span>🚗 Mobil</span>
                </button>
              </div>

              <div>
                <label className="block text-emerald-200 font-semibold mb-1 font-mono">Detail Tipe (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: ZX25R / NMAX / Avanza"
                  value={editVehicleDetail}
                  onChange={(e) => setEditVehicleDetail(e.target.value)}
                  className="w-full bg-[#020704] border border-emerald-900 focus:border-emerald-400 rounded-2xl py-2 px-3 text-xs text-white placeholder:text-emerald-900 focus:outline-none transition"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditVehicleOpen(false)}
                  disabled={editVehicleLoading}
                  className="flex-1 py-2.5 px-4 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 rounded-xl text-xs font-bold transition font-mono cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editVehicleLoading}
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-emerald-400 to-teal-500 text-black font-extrabold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  {editVehicleLoading ? (
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    <span>Simpan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pindahkan Jabatan Road Captain */}
      {memberToMakeCaptain && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in">
          <div className="max-w-sm w-full bg-[#050d09] border border-amber-900/60 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
              <Crown className="w-6 h-6 fill-amber-400" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-black text-white">Pindahkan Road Captain?</h3>
              <p className="text-xs text-emerald-300/60 leading-relaxed">
                Anda akan menyerahkan kendali kepemimpinan grup konvoi ini kepada <b className="text-white">{memberToMakeCaptain.name}</b>.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setMemberToMakeCaptain(null)}
                disabled={transferCaptainLoading}
                className="flex-1 py-2.5 px-4 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 rounded-xl text-xs font-bold transition font-mono cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmTransferCaptain}
                disabled={transferCaptainLoading}
                className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg font-mono cursor-pointer"
              >
                {transferCaptainLoading ? (
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <Crown className="w-3.5 h-3.5" />
                    <span>Ya, Jadikan Captain</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Keluar / Bubarkan Grup (Fully Isolated z-[9999]) */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in">
          <div className="max-w-sm w-full bg-[#050d09] border border-red-900/50 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-black text-white">
                {isCaptain ? 'Bubarkan Grup Konvoi?' : 'Keluar dari Konvoi?'}
              </h3>
              <p className="text-xs text-emerald-300/60 leading-relaxed">
                {isCaptain
                  ? '⚠️ Anda adalah Road Captain. Jika Anda keluar, grup konvoi ini akan BUBAR dan seluruh anggota akan otomatis dikeluarkan.'
                  : 'Posisi motor Anda akan dihapus dari peta rombongan dan pelacakan GPS akan dihentikan.'}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setIsLeaveModalOpen(false)}
                disabled={leaveLoading}
                className="flex-1 py-2.5 px-4 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 rounded-xl text-xs font-bold transition font-mono cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmLeave}
                disabled={leaveLoading}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-red-950 font-mono cursor-pointer"
              >
                {leaveLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{isCaptain ? 'Ya, Bubarkan' : 'Ya, Keluar'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Keluarkan Rider (Kick) */}
      {memberToKick && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in">
          <div className="max-w-sm w-full bg-[#050d09] border border-red-900/50 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto">
              <UserX className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-black text-white">Keluarkan Anggota?</h3>
              <p className="text-xs text-emerald-300/60 leading-relaxed">
                Apakah Anda yakin ingin mengeluarkan <b className="text-white">{memberToKick.name}</b> ({memberToKick.motorcycle_model}) dari konvoi?
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setMemberToKick(null)}
                disabled={kickLoading}
                className="flex-1 py-2.5 px-4 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 rounded-xl text-xs font-bold transition font-mono cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmKick}
                disabled={kickLoading}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-red-950 font-mono cursor-pointer"
              >
                {kickLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <UserX className="w-3.5 h-3.5" />
                    <span>Keluarkan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
