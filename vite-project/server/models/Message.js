import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  senderRole: { type: String, enum: ["buyer", "seller"], required: true },
  body: { type: String, required: true, maxlength: 2000 },
  // Was a copy emailed to the other person?
  emailStatus: {
    type: String,
    enum: ["pending", "sent", "skipped", "failed", "off"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
});

export const Message = mongoose.model("Message", messageSchema);

export function toMessageDto(m) {
  return {
    id: String(m._id),
    role: m.senderRole,
    body: m.body,
    createdAt: m.createdAt,
    emailStatus: m.emailStatus,
  };
}
