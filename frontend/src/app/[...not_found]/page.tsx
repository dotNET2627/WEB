import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 - Không tìm thấy đường link | Dental Care",
  description: "Đường dẫn bạn yêu cầu không tồn tại hoặc đã bị thay đổi.",
};

export default function CatchAllNotFound() {
  notFound();
}
