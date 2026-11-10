import React, { useState } from 'react';
import {
  MessageCircle,
  Send,
  X,
  Users,
  Sparkles,
  Share2,
} from 'lucide-react';
import {
  ChatMessage,
  JUBAH_DESIGNS,
  StudentAccount,
} from '../game/rules';

interface StudentChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentStudent: StudentAccount;
  allStudents: StudentAccount[];
  messages: ChatMessage[];
  onSendMessage: (recipientId: string, text: string, sharedOutfitLabel?: string) => void;
}

export const StudentChatDrawer: React.FC<StudentChatDrawerProps> = ({
  isOpen,
  onClose,
  currentStudent,
  allStudents,
  messages,
  onSendMessage,
}) => {
  const [activeChannel, setActiveChannel] = useState<string>('group');
  const [messageText, setMessageText] = useState('');

  if (!isOpen) return null;

  const classmates = allStudents.filter((s) => s.id !== currentStudent.id);
  const selectedClassmate = classmates.find((c) => c.id === activeChannel);

  const visibleMessages = messages.filter((msg) => {
    if (activeChannel === 'group') {
      return msg.recipientId === 'group';
    }
    return (
      (msg.senderId === currentStudent.id && msg.recipientId === activeChannel) ||
      (msg.senderId === activeChannel && msg.recipientId === currentStudent.id)
    );
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    onSendMessage(activeChannel, messageText.trim());
    setMessageText('');
  };

  const handleShareOutfit = () => {
    const activeJubah =
      JUBAH_DESIGNS.find((j) => j.id === currentStudent.selectedJubahId) || JUBAH_DESIGNS[0];
    onSendMessage(
      activeChannel,
      `Lihat karakter dan kamarku di mutaba'ah.id! Aku sedang memakai ${activeJubah.name} dengan kebersihan kamar ${currentStudent.bedroom.cleanliness}%! 🌟`,
      `${activeJubah.name} · Kamar Rapi ${currentStudent.bedroom.cleanliness}%`
    );
  };

  const quickGreetings = [
    'Assalamu\'alaikum teman-teman! 👋',
    'Sudah rapikan kasur & sholat tepat waktu belum? 🕌',
    'Yuk semangat setoran Hafalan hari ini! 📖',
    'Gagah banget Jubah karaktermu! ✨',
  ];

  return (
    <div
      role="dialog"
      aria-label="Chat Sesama Siswa Mutaba'ah"
      className="fixed right-4 top-20 z-50 w-[92vw] sm:w-[410px] rounded-3xl bg-white border-2 border-emerald-600/70 shadow-2xl overflow-hidden flex flex-col max-h-[82vh]"
    >
      {/* Top Chat Bar (Facebook Messenger Style) */}
      <div className="px-4 py-3.5 bg-emerald-800 text-white flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white">
              Chat Sesama Siswa · mutaba&apos;ah.id
            </h3>
            <p className="text-[11px] text-emerald-100">
              Saling menyemangati dalam Sholat, Mengaji &amp; Hafalan
            </p>
          </div>
        </div>

        <button
          type="button"
          aria-label="Tutup Jendela Chat Siswa"
          onClick={onClose}
          className="p-1.5 rounded-xl text-emerald-100 hover:text-white hover:bg-emerald-700 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Channel Selector Tabs: Grup Kelas vs Direct Student Chat */}
      <div className="px-3 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center gap-1.5 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveChannel('group')}
          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeChannel === 'group'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-amber-200 hover:bg-amber-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Grup Kelas</span>
        </button>

        {classmates.map((mate) => (
          <button
            key={mate.id}
            type="button"
            onClick={() => setActiveChannel(mate.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeChannel === mate.id
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <span>{mate.name.split(' ')[0]}</span>
            <span className="text-[10px] opacity-75">({mate.gender})</span>
          </button>
        ))}
      </div>

      {/* Active Recipient Subheader */}
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
        <span>
          Obrolan:{' '}
          <strong className="text-emerald-800">
            {activeChannel === 'group'
              ? 'Semua Siswa Mutaba\'ah'
              : `${selectedClassmate?.name} (${selectedClassmate?.email})`}
          </strong>
        </span>
        <button
          type="button"
          onClick={handleShareOutfit}
          className="text-emerald-700 hover:text-emerald-900 font-extrabold inline-flex items-center gap-1 cursor-pointer"
        >
          <Share2 className="w-3 h-3" />
          <span>Pamerkan Jubah</span>
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[320px] bg-[#fcfaf5]">
        {visibleMessages.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <p className="text-xs text-slate-500">
              Belum ada pesan pribadi dengan {selectedClassmate?.name}.
            </p>
            <p className="text-[11px] text-emerald-700 font-bold">
              Sapa temanmu dengan ucapan Assalamu&apos;alaikum!
            </p>
          </div>
        ) : (
          visibleMessages.map((m) => {
            const isMe = m.senderId === currentStudent.id;
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[11px] font-extrabold text-emerald-800">
                    {isMe ? 'Kamu' : m.senderName}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ({m.senderEmail})
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono-tabular">
                    {m.timestamp}
                  </span>
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-xs ${
                    isMe
                      ? 'bg-emerald-700 text-white rounded-br-xs'
                      : 'bg-white text-slate-800 border border-amber-200 rounded-bl-xs'
                  }`}
                >
                  <p>{m.text}</p>
                  {m.sharedOutfitLabel && (
                    <div className="mt-2 p-2 rounded-xl bg-amber-50 border border-amber-300 flex items-center gap-2 text-[11px] text-amber-950">
                      <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <div className="font-extrabold">Status Jubah &amp; Kamar:</div>
                        <div>{m.sharedOutfitLabel}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Greeting Chips */}
      <div className="px-3 py-2 bg-amber-50/70 border-t border-amber-200 flex items-center gap-1.5 overflow-x-auto">
        {quickGreetings.map((greet, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSendMessage(activeChannel, greet)}
            className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 border border-amber-300 text-[11px] font-semibold text-slate-800 whitespace-nowrap cursor-pointer"
          >
            {greet}
          </button>
        ))}
      </div>

      {/* Message Input Box */}
      <form
        onSubmit={handleSubmit}
        className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
      >
        <input
          type="text"
          aria-label="Ketik pesan ke sesama siswa"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Ketik pesan semangat untuk teman..."
          className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
        />
        <button
          type="submit"
          aria-label="Kirim Pesan"
          className="px-3.5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs flex items-center gap-1 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span>Kirim</span>
        </button>
      </form>
    </div>
  );
};
