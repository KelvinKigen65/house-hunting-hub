import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

export default function LandlordInquiriesPage() {
  const { user } = useAuth();
  const [inquiries, setInquiries] = useState([]);
  const [replies, setReplies] = useState({});

  useEffect(() => {
    supabase.from("inquiries").select("*, properties(title), profiles!tenant_id(full_name, phone)")
      .eq("landlord_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setInquiries(data || []));
  }, []);

  async function sendReply(id) {
    if (!replies[id]) return;
    await supabase.from("inquiries").update({ reply: replies[id], replied_at: new Date().toISOString(), is_read: true }).eq("id", id);
    setInquiries(i => i.map(x => x.id === id ? { ...x, reply: replies[id] } : x));
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-display text-3xl font-bold text-gray-900 mb-8">Tenant Inquiries</h1>
      {inquiries.length === 0 ? (
        <div className="card p-16 text-center text-gray-400"><div className="text-5xl mb-4">📨</div><p>No inquiries yet.</p></div>
      ) : (
        <div className="space-y-4">
          {inquiries.map(inq => (
            <div key={inq.id} className="card p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-gray-900">{inq.profiles?.full_name}</p>
                  <p className="text-xs text-gray-400">About: {inq.properties?.title} · {new Date(inq.created_at).toLocaleDateString("en-KE")}</p>
                </div>
                {!inq.reply && <span className="badge-pending">Unanswered</span>}
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700 mb-3">{inq.message}</div>
              {inq.reply ? (
                <div className="bg-brand-50 rounded-xl p-3 text-sm text-brand-800">
                  <span className="font-medium">Your reply: </span>{inq.reply}
                </div>
              ) : (
                <div className="flex gap-2">
                  <textarea rows={2} value={replies[inq.id] || ""}
                    onChange={(e) => setReplies(r => ({ ...r, [inq.id]: e.target.value }))}
                    placeholder="Type your reply..." className="input-field text-sm py-2 flex-1 resize-none" />
                  <button onClick={() => sendReply(inq.id)} className="btn-primary text-sm px-4 self-end">Reply</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}